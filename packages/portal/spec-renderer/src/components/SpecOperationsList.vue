<template>
  <section
    :aria-label="i18n.t('specOperationsList.ariaLabel')"
    class="kong-ui-public-spec-operations-list"
    data-testid="kong-ui-public-spec-operations-list"
    role="navigation"
    :style="{ width: widthStyle }"
  >
    <div v-if="operations">
      <!-- filter -->
      <div
        v-if="isFilterable"
        class="filter-wrapper"
      >
        <KInput
          v-model="filterQuery"
          class="filter-input"
          data-testid="spec-operations-list-filter"
          :placeholder="i18n.t('specOperationsList.filterPlaceholder')"
        >
          <template #before>
            <FilterIcon
              decorative
            />
          </template>
        </KInput>
      </div>

      <!-- render operations list -->
      <div v-if="filteredItems.length">
        <div
          v-for="section in sectionHeadings"
          :key="section"
          class="section-wrapper"
          :data-testid="`spec-operations-list-section-${section.toLowerCase().replaceAll(' ', '-')}`"
        >
          <KCollapse
            :model-value="false"
            trigger-alignment="leading"
          >
            <template #trigger="{ isCollapsed, toggle }">
              <OperationsListSectionHeader
                :content-element-id="getSectionContentId(section)"
                :data-testid="`spec-operations-list-section-${section.toLowerCase().replaceAll(' ', '-')}-collapse-trigger`"
                :description="getSectionDescription(section)"
                :is-collapsed="isCollapsed"
                :name="section"
                @toggle="toggle"
              />
            </template>

            <div :id="getSectionContentId(section)">
              <template
                v-for="item in getSectionItems(section)"
                :key="`${item.path}-${item.method}`"
              >
                <slot
                  :item="item"
                  name="item"
                  :section="section"
                  :select="() => handleSelection(item)"
                >
                  <OperationsListItem
                    :disable-selection="disableSelection"
                    :is-selected="isSelected(item)"
                    :item="item"
                    :section="section"
                    @click="handleSelection"
                  />
                </slot>
              </template>
            </div>
          </KCollapse>
        </div>

        <!-- Items without any tags -->
        <div
          v-if="(!isFilterable || !filterQuery) && untaggedItems.length"
          class="section"
          data-testid="spec-operations-list-untagged-items"
        >
          <KCollapse
            :model-value="false"
            trigger-alignment="leading"
          >
            <template #trigger="{ isCollapsed, toggle }">
              <OperationsListSectionHeader
                :content-element-id="getSectionContentId(DEFAULT_UNTAGGED_SECTION_NAME)"
                :data-testid="`spec-operations-list-section-untagged-collapse-trigger`"
                :description="getSectionDescription(DEFAULT_UNTAGGED_SECTION_NAME)"
                :is-collapsed="isCollapsed"
                :name="DEFAULT_UNTAGGED_SECTION_NAME"
                @toggle="toggle"
              />
            </template>

            <div :id="getSectionContentId(DEFAULT_UNTAGGED_SECTION_NAME)">
              <template
                v-for="item in untaggedItems"
                :key="`${item.path}-${item.method}`"
              >
                <slot
                  :item="item"
                  name="untagged-item"
                  :section="DEFAULT_UNTAGGED_SECTION_NAME"
                  :select="() => handleSelection(item)"
                >
                  <OperationsListItem
                    :disable-selection="disableSelection"
                    :is-selected="isSelected(item)"
                    :item="item"
                    @click="handleSelection"
                  />
                </slot>
              </template>
            </div>
          </KCollapse>
        </div>
      </div>

      <!-- Empty State -->
      <div
        v-else
        data-testid="kong-ui-public-spec-operations-list-empty"
      >
        <slot name="empty-state">
          <div class="center">
            {{ i18n.t('specOperationsList.noResults') }}
          </div>
        </slot>
      </div>
    </div>

    <!-- Error State -->
    <div
      v-else
      data-testid="kong-ui-public-spec-operations-list-error"
    >
      <slot name="error-state">
        {{ i18n.t('specOperationsList.error') }}
      </slot>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, watch, onMounted } from 'vue'
import type { OperationListFilterFunction, Operation, OperationListItem, Tag } from '../types'
import { v1 as uuidv1 } from 'uuid'
import clonedeep from 'lodash.clonedeep'
import composables from '../composables'
import { DEFAULT_UNTAGGED_SECTION_NAME } from '../constants'
import OperationsListSectionHeader from './operations-list/OperationsListSectionHeader.vue'
import OperationsListItem from './operations-list/OperationsListItem.vue'
import { FilterIcon } from '@kong/icons'

const props = defineProps({
  operations: {
    type: Array as PropType<Operation[]>,
    required: true,
    validator: (items: Operation[]): boolean => !items.length || hasRequiredProps(items, ['method', 'path']),
  },
  tags: {
    type: Array as PropType<Tag[]>,
    default: () => [],
    validator: (items: Tag[]): boolean => !items.length || hasRequiredProps(items, ['name']),
  },
  isFilterable: {
    type: Boolean,
    default: true,
  },
  filterFunction: {
    type: Function as PropType<OperationListFilterFunction>,
    default: (({ items, query }) => {
      query = query.toLowerCase()

      return items.filter((item) => item.tag && String(item.tag).toLowerCase().includes(query))
    }) as OperationListFilterFunction,
    validator: (maybeFunc) => !!maybeFunc && typeof maybeFunc === 'function',
  },
  deselect: {
    type: Boolean,
    default: false,
  },
  disableSelection: {
    type: Boolean,
    default: false,
  },
  width: {
    type: String,
    default: '210',
  },
})

const emit = defineEmits(['selected'])

const { i18n } = composables.useI18n()

// Generate unique identifier of this instance for safe HTML element id generation
const uid = computed<string>(() => uuidv1())

const filterQuery = ref<string>('')
const taggedItems = ref<OperationListItem[]>([])
const selectedItem = ref<OperationListItem>()
const filteredItems = ref<OperationListItem[]>([])

const filterItems = () => {
  const allItems = taggedItems.value

  if (!props.isFilterable) {
    filteredItems.value = allItems
    return
  }

  if (!props.filterFunction || typeof props.filterFunction !== 'function') {
    throw new Error(`filterFunction property must be a function, got ${typeof props.filterFunction}`)
  }

  filteredItems.value = props.filterFunction({ items: allItems, query: filterQuery.value })
}

const widthStyle = computed<string>(() => getSizeFromString(props.width))

const sectionHeadings = computed<string[]>(() => {
  const headings: string[] = []

  filteredItems.value.forEach((item: OperationListItem) => {
    if (item.tag && !headings.includes(item.tag)) {
      headings.push(String(item.tag))
    }
  })

  return headings
})

const untaggedItems = computed((): OperationListItem[] => {
  return taggedItems.value.filter((item) => !item.tag)
})

const getSectionDescription = (section: string): string => {
  if (!props.tags || !Array.isArray(props.tags)) {
    return ''
  }
  const tagData = props.tags.find((item) => item.name === section)
  return tagData?.description || ''
}

const getSectionItems = (section: string): OperationListItem[] => {
  return filteredItems.value.filter((item) => item.tag === section)
}

const isSelected = (item: OperationListItem): boolean => {
  const s = selectedItem.value

  return !!s && s.path === item.path && s.method === item.method && s.operationId === item.operationId && s.tag === item.tag
}

const getSectionContentId = (section: string) => `${uid.value}-section-${section.toLowerCase()}`

const handleSelection = (item: OperationListItem) => {
  if (!props.disableSelection) {
    selectedItem.value = item
    emit('selected', item)
  }
}

const generateTaggedItems = (): void => {
  taggedItems.value = []

  if (!props.operations) {
    return
  }

  props.operations.forEach((item: Operation) => {
    const modifiedItem:any = clonedeep(item)

    if (item.tags?.length) {
      item.tags.forEach((tag: string) => {
        delete modifiedItem.tags
        modifiedItem.tag = tag
        taggedItems.value.push(clonedeep(modifiedItem as OperationListItem))
      })
    } else {
      delete modifiedItem.tags
      modifiedItem.tag = null
      taggedItems.value.push(clonedeep(modifiedItem as OperationListItem))
    }
  })

  // Initial filtering to populate filteredItems
  filterItems()
}

watch(() => props.deselect, () => {
  if (props.deselect) {
    selectedItem.value = undefined
  }
})
watch(() => props.operations, () => generateTaggedItems())

watch(filterQuery, () => filterItems())

onMounted(() => {
  generateTaggedItems()
})
</script>

<script lang="ts">
// Must import in a separate script block so `hasRequiredProps` can be used in prop validator
const { getSizeFromString, hasRequiredProps } = composables.useUtilities()
</script>

<style lang="scss" scoped>
/* stylelint-disable @kong/design-tokens/token-var-usage */
.kong-ui-public-spec-operations-list {
  color: var(--kong-ui-kong-spec-renderer-operations-list-text-color, var(--kong-ui-spec-renderer-text-color, $kui-color-text));
  font-family: var(--kong-ui-spec-renderer-operations-list-font-family, var(--kong-ui-spec-renderer-font-family, $kui-font-family-text));
  font-size: var(--kong-ui-spec-renderer-operations-list-font-size, var(--kong-ui-spec-renderer-font-size, $kui-font-size-40));

  .filter-wrapper {
    margin-bottom: $kui-space-40;
    position: relative;
  }

  .filter-input {
    width: 100%;

    &:deep(.input) {
      padding-left: $kui-space-90;
    }
  }

  .section-wrapper {
    margin-bottom: $kui-space-40;

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  .center {
    text-align: center;
  }

  // KCollapse overrides
  :deep(.k-collapse .k-collapse-heading) {
    margin: $kui-space-0 !important;
  }
}
</style>
