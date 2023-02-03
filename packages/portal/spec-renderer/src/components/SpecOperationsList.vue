<template>
  <section
    aria-label="List of operations"
    class="kong-ui-public-spec-operations-list"
    role="navigation"
    :style="{ width: widthStyle }"
  >
    <div
      v-if="isFilterable"
      class="filter-wrapper"
    >
      <KInput
        v-model="filterQuery"
        class="filter-input"
        :placeholder="t('specOperationsList.filterPlaceholder')"
      />
      <KIcon
        aria-hidden="true"
        class="filter-icon"
        color="var(--kong-ui-spec-renderer-operations-list-filter-icon-color, #1C1B1F)"
        icon="filter"
      />
    </div>
    <div v-if="operations">
      <div v-if="filteredItems.length">
        <div
          v-for="section in sectionHeadings"
          :key="section"
          class="section-wrapper"
        >
          <KCollapse
            :model-value="false"
            trigger-alignment="leading"
          >
            <template #trigger="{ isCollapsed, toggle }">
              <OperationsListSectionHeader
                :content-element-id="getSectionContentId(section)"
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
          v-if="!isFilterable || !filterQuery"
          class="section"
        >
          <template
            v-for="item in untaggedItems"
            :key="`${item.path}-${item.method}`"
          >
            <slot
              :item="item"
              name="item"
              :select="() => handleSelection(item)"
            >
              <OperationsListItem
                :is-selected="isSelected(item)"
                :item="item"
                @click="handleSelection"
              />
            </slot>
          </template>
        </div>
      </div>
      <!-- Empty State -->
      <div
        v-else
        data-testid="kong-ui-public-spec-operations-list-empty"
      >
        <slot name="empty-state">
          <div class="center">
            {{ t('specOperationsList.noResults') }}
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
        {{ t('specOperationsList.error') }}
      </slot>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PropType, computed, ref, watch, onMounted } from 'vue'
import type { OperationListFilterFunction, Operation, OperationListItem, Tag } from '../types'
import { v1 as uuidv1 } from 'uuid'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../locales/en.json'
import clonedeep from 'lodash.clonedeep'
import useUtilities from '../composables/useUtilities'
import OperationsListSectionHeader from './operations-list/OperationsListSectionHeader.vue'
import OperationsListItem from './operations-list/OperationsListItem.vue'

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
  width: {
    type: String,
    default: '210',
  },
  filterFunction: {
    type: Function as PropType<OperationListFilterFunction>,
    default: (({ items, query }) => {
      query = query.toLowerCase()

      return items.filter((item) => item.tag && item.tag.toLowerCase().includes(query))
    }) as OperationListFilterFunction,
    validator: (maybeFunc) => !!maybeFunc && typeof maybeFunc === 'function',
  },

  testMode: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['selected'])

const { t } = createI18n('en-us', english)

// Generate unique identifier of this instance for safe HTML element id generation
const uid = computed<string>(() => props.testMode ? 'test-spec-ops-list-1234' : uuidv1())

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
      headings.push(item.tag)
    }
  })

  return headings
})

const untaggedItems = computed((): OperationListItem[] => {
  return taggedItems.value.filter((item) => !item.tag)
})

const getSectionDescription = (section: string): string => {
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
  selectedItem.value = item
  emit('selected', item)
}

const generateTaggedItems = (): void => {
  taggedItems.value = []

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

watch(() => props.operations, () => generateTaggedItems())

watch(filterQuery, () => filterItems())

onMounted(() => {
  generateTaggedItems()
})
</script>

<script lang="ts">
// Must import in a separate script block so `hasRequiredProps` can be used in prop validator
const { getSizeFromString, hasRequiredProps } = useUtilities()
</script>

<style lang="scss" scoped>
.kong-ui-public-spec-operations-list {
  color: var(--kong-ui-kong-spec-renderer-operations-list-text-color, var(--kong-ui-spec-renderer-text-color, var(--black-500, #0B172D)));
  font-family: var(--kong-ui-spec-renderer-operations-list-font-family, var(--kong-ui-spec-renderer-font-family, Roboto, Helvetica, sans-serif));
  font-size: var(--kong-ui-spec-renderer-operations-list-font-size, var(--kong-ui-spec-renderer-font-size, 16px));

  .filter-wrapper {
    margin-bottom: 8px;
    position: relative;
  }

  .filter-input {
    width: 100%;

    &:deep(.k-input) {
      padding-left: 34px;
    }
  }

  .filter-icon {
    left: 10px;
    position: absolute;
    top: calc(50% - 8px);
  }

  .section-wrapper {
    margin-bottom: 8px;

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  .center {
    text-align: center;
  }

  // KCollapse overrides
  :deep(.k-collapse .k-collapse-heading) {
    margin: 0 !important;
  }
}
</style>
