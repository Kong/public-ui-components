<template>
  <div
    class="kong-spec-renderer-mini"
    :style="widthStyle"
  >
    <KInput
      v-if="isFilterable"
      v-model="filterQuery"
      class="filter-input"
      placeholder="Filter by tag"
      type="search"
    />
    <div
      v-if="spec"
      :class="{ 'is-summary': isSummary }"
    >
      <div v-if="hasData">
        <KCollapse
          v-for="section in sectionHeadings"
          :key="section"
          :model-value="false"
          trigger-alignment="leading"
        >
          <template #trigger="{ isCollapsed, toggle }">
            <div
              class="mini-spec-renderer-section d-flex"
              @click="toggle()"
            >
              <div class="mini-spec-renderer-section-toggle mr-2">
                <KIcon
                  v-if="isCollapsed"
                  color="var(--grey-400)"
                  icon="chevronUp"
                  size="18"
                />
                <KIcon
                  v-else
                  color="var(--grey-600)"
                  icon="chevronDown"
                  size="18"
                />
              </div>
              <div
                class="mini-spec-renderer-section-label"
                :class="{ 'mr-2': isSummary }"
              >
                {{ section }}
              </div>
              <div
                v-if="isSummary && getSectionDescription(section)"
                class="mini-spec-renderer-section-description ml-auto truncate"
                :title="getSectionDescription(section)"
              >
                {{ getSectionDescription(section) }}
              </div>
            </div>
          </template>

          <SpecItem
            v-for="item in getSectionItems(section)"
            :key="item.key"
            :is-summary="isSummary"
            :item="item"
            @click="handleSelection"
          />
        </KCollapse>

        <!-- Items without any tags -->
        <div class="mt-2">
          <SpecItem
            v-for="item in untaggedItems"
            :key="item.key"
            class="mini-spec-renderer-untagged"
            :is-summary="isSummary"
            :item="item"
            @click="handleSelection"
          />
        </div>
      </div>
      <!-- Empty State -->
      <div
        v-else
        data-testid="kong-portal-spec-renderer-mini-empty"
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
      data-testid="kong-portal-spec-renderer-mini-error"
    >
      <slot name="error-state">
        Error: No document spec provided
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, onMounted, computed, ref, watch } from 'vue'
import type { SpecFilterFunction, SpecItemType, SpecTag } from '../types'
import { KCollapse, KIcon, KInput } from '@kong/kongponents'
import SpecItem from './SpecItem.vue'

const filterQuery = ref<string>('')

const props = defineProps({
  spec: {
    type: Array as PropType<SpecItemType[]>,
    required: true,
    validator: (items: SpecItemType[]): boolean => !items.length || hasRequiredProps(items, ['method', 'path']),
  },
  tags: {
    type: Array as PropType<SpecTag[]>,
    default: () => [],
    validator: (items: SpecTag[]): boolean => !items.length || hasRequiredProps(items, ['name']),
  },
  isFilterable: {
    type: Boolean,
    default: true,
  },
  isSummary: {
    type: Boolean,
    default: false,
  },
  width: {
    type: String,
    default: '210',
  },
  filterFunc: {
    type: Function as PropType<SpecFilterFunction>,
    default: (({ items, query }) => {
      query = query.toLowerCase()

      return items.filter((item) => item.tags?.some((tag) => tag.toLowerCase().includes(query)))
    }) as SpecFilterFunction,
    validator: (maybeFunc) => !!maybeFunc && typeof maybeFunc === 'function',
  },
})

const emit = defineEmits(['selected'])

const filteredItems = ref<SpecItemType[]>([])

function filterItems() {
  if (!props.isFilterable) {
    filteredItems.value = itemArray.value
    return
  }

  if (!props.filterFunc || typeof props.filterFunc !== 'function') {
    throw new Error(`filterFunc property must be a function, got ${typeof props.filterFunc}`)
  }

  filteredItems.value = props.filterFunc({ items: itemArray.value, query: filterQuery.value })
}

watch(() => props.spec, () => {
  filterItems()
})

watch(filterQuery, () => {
  filterItems()
})

const itemArray = ref<SpecItemType[]>(props.spec.map((item, idx) => {
  return {
    ...item,
    selected: false,
    key: `${item.path}-${item.method}-${idx}`,
  }
}))

filterItems()

const getSizeFromString = (sizeStr: string): string => {
  return sizeStr === 'auto' || sizeStr.endsWith('%') || sizeStr.endsWith('vw') || sizeStr.endsWith('vh') || sizeStr.endsWith('px') ? sizeStr : sizeStr + 'px'
}

const widthStyle = computed(() => {
  return {
    width: getSizeFromString(props.width),
  }
})

const hasData = computed((): boolean => {
  return !!filteredItems.value?.length
})

const sectionHeadings = computed(() => {
  const headings:string[] = []

  filteredItems.value.forEach((item: SpecItemType) => {
    item.tags?.forEach((tag: string) => {
      if (tag && !headings.includes(tag)) {
        headings.push(tag)
      }
    })
  })

  return headings
})

const untaggedItems = computed((): SpecItemType[] => {
  return filteredItems.value.filter((item: SpecItemType) => !item.tags?.length)
})

const getSectionDescription = (section: string): string => {
  const tagData = props.tags.find((item: SpecTag) => item.name === section)

  return tagData?.description || ''
}

const getSectionItems = (section: string): SpecItemType[] => {
  return filteredItems.value.filter((item: SpecItemType) => item.tags?.includes(section))
}

const handleSelection = (selectedItem: SpecItemType) => {
  /**
   * TODO: fix multiple items selected when an item has multiple tags
   */
  itemArray.value.forEach((anItem: SpecItemType) => {
    if (selectedItem.key === anItem.key) {
      anItem.selected = true
    } else {
      anItem.selected = false
    }
  })

  emit('selected', selectedItem)
}

onMounted(() => {
  itemArray.value = props.spec.map((item: SpecItemType, idx: number) => {
    return {
      ...item,
      selected: false,
      key: `${item.path}-${item.method}-${idx}`,
    }
  })
})
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
.kong-spec-renderer-mini {
  color: var(--kong-spec-renderer-mini-text-color, #000);
  font-family: var(--kong-spec-renderer-mini-font-family-default, Roboto, Helvetica, sans-serif);
  font-size: var(--kong-spec-renderer-mini-font-size, 16px);

  .center {
    text-align: center;
  }

  .mini-spec-renderer-section {
    .mini-spec-renderer-section-label {
      color: var(--grey-600);
      font-weight: 600;
    }
  }

  .mini-spec-renderer-untagged {
    margin-left: -12px;
  }

  .is-summary {
    .mini-spec-renderer-section {
      border: 1px solid var(--grey-200);
      border-radius: 4px 4px 0 0;
      padding: 10px 8px 10px 12px;

      .mini-spec-renderer-section-toggle {
        align-self: end;
        height: 18px;
      }

      .mini-spec-renderer-section-label {
        font-size: var(--type-lg);
      }

      .mini-spec-renderer-section-description {
        font-family: monospace;
        max-width: 65%;
      }
    }

    .mini-spec-renderer-untagged {
      margin-left: unset;
      margin-top: 12px;
    }
  }
}

.filter-input {
  width: 100%;
  margin-bottom: 8px;
}
</style>

<style lang="scss">
.kong-spec-renderer-mini {
  // all but the first have top margin
  .k-collapse + .k-collapse {
    margin-top: var(--spacing-md);
  }

  .k-collapse .k-collapse-heading {
    margin: 0 !important;
  }

  .k-collapse-hidden-content {
    .mini-spec-item:last-of-type {
      border-radius: 0 0 4px 4px;
    }
  }
}
</style>
