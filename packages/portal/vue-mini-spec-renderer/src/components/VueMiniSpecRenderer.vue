<template>
  <div
    class="kong-portal-vue-mini-spec-renderer"
    :style="widthStyle"
  >
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
              <div class="mini-spec-renderer-section-label">
                {{ section }}
              </div>
              <div class="mini-spec-renderer-section-toggle ml-auto">
                <KIcon
                  v-if="isCollapsed"
                  color="var(--grey-500)"
                  icon="chevronLeft"
                />
                <KIcon
                  v-else
                  color="var(--grey-500)"
                  icon="chevronDown"
                />
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
      </div>
      <!-- Empty State -->
      <div
        v-else
        data-testid="kong-portal-vue-mini-spec-renderer-empty"
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
      data-testid="kong-portal-vue-mini-spec-renderer-error"
    >
      <slot name="error-state">
        Error: No document spec provided
      </slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { PropType, onMounted, computed, ref } from 'vue'
import type { SpecItemType } from '../types'
import { KCollapse, KIcon } from '@kong/kongponents'
import SpecItem from './SpecItem.vue'

const props = defineProps({
  spec: {
    type: Array as PropType<SpecItemType[]>,
    required: true,
    validator: (items: SpecItemType[]): boolean => !items.length || hasRequiredProps(items),
  },
  isSummary: {
    type: Boolean,
    default: false,
  },
  width: {
    type: String,
    default: '210',
  },
})

const emit = defineEmits(['selected'])

const itemArray = ref<SpecItemType[]>([])
const sectionHeadings = computed(() => {
  const headings:string[] = []

  itemArray.value.forEach((item: SpecItemType) => {
    item.tags.forEach((tag: string) => {
      if (tag && !headings.includes(tag)) {
        headings.push(tag)
      }
    })
  })

  return headings
})

const hasData = computed((): boolean => {
  return !!props.spec?.length
})

const getSizeFromString = (sizeStr: string): string => {
  return sizeStr === 'auto' || sizeStr.endsWith('%') || sizeStr.endsWith('vw') || sizeStr.endsWith('vh') || sizeStr.endsWith('px') ? sizeStr : sizeStr + 'px'
}

const widthStyle = computed(() => {
  return {
    width: getSizeFromString(props.width),
  }
})

const getSectionItems = (section: string): SpecItemType[] => {
  return itemArray.value.filter((item: SpecItemType) => item.tags.includes(section))
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
const hasRequiredProps = (items: SpecItemType[]): boolean => {
  items.forEach((item: SpecItemType) => {
    if (item.method === undefined || item.summary === undefined || item.path === undefined) {
      return false
    }
  })

  return true
}
</script>

<style lang="scss" scoped>
.kong-portal-vue-mini-spec-renderer {
  font-family: var(--kong-portal-vue-mini-spec-renderer-font-family-default, Roboto, Helvetica, sans-serif);
  font-size: var(--kong-portal-vue-mini-spec-renderer-font-size, 16px);
  color: var(--kong-portal-vue-mini-spec-renderer-text-color, #000);

  .center {
    text-align: center;
  }

  .mini-spec-renderer-section {
    .mini-spec-renderer-section-label {
      font-weight: 600;
      color: var(--grey-600);
    }
  }

  .is-summary {
    .mini-spec-renderer-section {
      .mini-spec-renderer-section-label {
        font-size: var(--type-lg);
      }
    }
  }
}
</style>

<style lang="scss">
.kong-portal-vue-mini-spec-renderer {
  // all but the first have top margin
  .k-collapse + .k-collapse {
    margin-top: var(--spacing-md);
  }
}
</style>
