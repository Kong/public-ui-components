<template>
  <section
    aria-label="List of operations"
    class="kong-ui-public-operations-list"
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
        placeholder="Filter by tag"
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
        <div class="section">
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
            No results
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
        Error: No document spec provided
      </slot>
    </div>
  </section>
</template>

<script setup lang="ts">
import { PropType, computed, ref, watch } from 'vue'
import type { OperationListFilterFunction, Operation, Tag } from '../types'
import { KCollapse, KInput, KIcon } from '@kong/kongponents'
import OperationsListItem from './OperationsListItem.vue'
import OperationsListSectionHeader from './OperationsListSectionHeader.vue'

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

      return items.filter((item) => item.tags?.some((tag) => tag.toLowerCase().includes(query)))
    }) as OperationListFilterFunction,
    validator: (maybeFunc) => !!maybeFunc && typeof maybeFunc === 'function',
  },
})

const emit = defineEmits(['selected'])

// Generate unique identifier of this instance for safe HTML element id generation
const uid = computed<string>(() => [...Array(8)].map(() => Math.random().toString(36)[2]).join(''))

const filterQuery = ref<string>('')
const selectedItem = ref<Operation | null>(null)
const filteredItems = ref<Operation[]>([])

const filterItems = () => {
  const allItems = props.operations

  if (!props.isFilterable) {
    filteredItems.value = allItems
    return
  }

  if (!props.filterFunction || typeof props.filterFunction !== 'function') {
    throw new Error(`filterFunction property must be a function, got ${typeof props.filterFunction}`)
  }

  filteredItems.value = props.filterFunction({ items: allItems, query: filterQuery.value })
}

watch([props.operations, filterQuery], () => filterItems())

// Initial filtering to populate filteredItems
filterItems()

const getSizeFromString = (sizeStr: string): string => (
  sizeStr === 'auto' ||
  sizeStr.endsWith('%') ||
  sizeStr.endsWith('vw') ||
  sizeStr.endsWith('vh') ||
  sizeStr.endsWith('px')
    ? sizeStr
    : sizeStr + 'px'
)

const widthStyle = computed<string>(() => getSizeFromString(props.width))

const sectionHeadings = computed<string[]>(() => {
  const headings: string[] = []

  filteredItems.value.forEach((item) => {
    item.tags?.forEach((tag: string) => {
      if (tag && !headings.includes(tag)) {
        headings.push(tag)
      }
    })
  })

  return headings
})

const untaggedItems = computed((): Operation[] => {
  return filteredItems.value.filter((item) => !item.tags?.length)
})

const getSectionDescription = (section: string): string => {
  const tagData = props.tags.find((item) => item.name === section)

  return tagData?.description || ''
}

const getSectionItems = (section: string): Operation[] => {
  return filteredItems.value.filter((item) => item.tags?.includes(section))
}

const isSelected = (item: Operation): boolean => {
  const s = selectedItem.value
  return !!s && s.path === item.path && s.method === item.method && s.operationId === item.operationId
}

const getSectionContentId = (section: string) => `${uid.value}-section-${section.toLowerCase()}`

const handleSelection = (item: Operation) => {
  selectedItem.value = item
  emit('selected', item)
}
</script>

<script lang="ts">
/**
 * Check if all of the provided items have a non-falsey value for all of the provided required props
 *
 * @param items The items to validate the prop exists for
 * @param requiredProps An array of all the required prop names
 * @returns Boolean whether or not the items have all the required props
 */
const hasRequiredProps = (items: object[], requiredProps: string[]): boolean => {
  let isValid = true

  items.forEach((item: object) => {
    requiredProps.forEach((requiredProp: string) => {
      if (!item[requiredProp as keyof typeof item]) {
        isValid = false
      }
    })
  })

  return isValid
}
</script>

<style lang="scss" scoped>
.kong-ui-public-operations-list {
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
