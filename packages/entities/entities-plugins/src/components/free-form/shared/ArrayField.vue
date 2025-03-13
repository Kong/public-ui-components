<template>
  <div
    ref="root"
    class="ff-array-field"
    :class="{
      [`ff-array-field-${appearance ?? 'default'}`]: true,
      'ff-array-field-sticky-tabs': stickyTabs,
    }"
  >
    <header class="ff-array-field-header">
      <KLabel
        v-if="label"
        class="ff-array-field-label"
        v-bind="labelAttributes"
        :required="required"
      >
        {{ label }}
        <template
          v-if="labelAttributes?.info"
          #tooltip
        >
          <!-- eslint-disable-next-line vue/no-v-html -->
          <div v-html="labelAttributes?.info" />
        </template>
      </KLabel>
      <KButton
        appearance="tertiary"
        icon
        @click="addItem"
      >
        <AddIcon />
      </KButton>
    </header>

    <template
      v-if="realItems.length"
    >
      <div
        v-if="appearance !== 'tabs'"
        class="ff-array-field-container"
      >
        <ListTag
          v-for="(item, index) of realItems"
          :key="getKey(item, index)"
          class="ff-array-field-item"
          :data-index="index"
        >
          <div class="ff-array-field-item-content">
            <slot
              :index="index"
              :item="item"
              name="item"
            />
          </div>
          <KButton
            appearance="tertiary"
            class="ff-array-field-item-remove"
            icon
            @click="removeItem(index)"
          >
            <TrashIcon />
          </KButton>
        </ListTag>
      </div>
      <KCard v-else>
        <KTabs
          v-model="activeTab"
          :tabs="tabs"
        >
          <template
            v-for="(item, index) of realItems"
            :key="getKey(item, index)"
            #[getKey(item,index)]
          >
            <div
              class="ff-array-field-item"
              :data-index="index"
            >
              <slot
                :index="index"
                :item="item"
                name="item"
              />
            </div>
          </template>
          <template
            v-for="(item, index) of realItems"
            :key="getKey(item, index)"
            #[`${getKey(item,index)}-anchor`]
          >
            {{ getTabTitle(item, index) }}
            <KButton
              appearance="tertiary"
              class="ff-array-field-item-remove"
              icon
              @click.stop="removeItem(index)"
            >
              <TrashIcon />
            </KButton>
          </template>
        </KTabs>
      </KCard>
    </template>
  </div>
</template>

<script setup lang="ts" generic="T">
import { useTemplateRef, nextTick, watch, computed, ref } from 'vue'
import { AddIcon, TrashIcon } from '@kong/icons'
import { uniqueId } from 'lodash-es'
import { KCard, type LabelAttributes } from '@kong/kongponents'

const props = defineProps<{
  items?: T[] | null
  label?: string
  labelAttributes?: LabelAttributes
  itemLabel?: string | ((item: T, index: number) => string)
  required?: boolean
  appearance?: 'default' | 'card' | 'tabs'
  stickyTabs?: boolean | string | number
}>()

const emit = defineEmits<{
  add: [];
  remove: [index: number];
}>()

const keyMap = new Map<T, string>()
const realItems = computed(() => props.items || [])

const ListTag = computed(() => props.appearance === 'card' ? KCard : 'div')

function generateId() {
  return uniqueId('ff-array-field-')
}

function getKey(item: T, index: number) {
  if (typeof item === 'object') {
    return keyMap.get(item)
  }

  return `ff-array-field-${index}`
}

function getTabTitle(item: T, index: number) {
  return typeof props.itemLabel === 'function'
    ? props.itemLabel(item, index)
    : props.itemLabel || `Item #${index}`
}

watch(realItems, (newItems) => {
  newItems.forEach((item) => {
    if (!keyMap.has(item)) {
      keyMap.set(item, generateId())
    }
  })

  const current = new Set(newItems)
  keyMap.keys().forEach((key) => {
    if (!current.has(key)) {
      keyMap.delete(key)
    }
  })
}, { immediate: true, deep: true })

const tabs = computed(() => realItems.value.map((item, index) => {
  const hash = `#${getKey(item, index)}`

  return {
    hash,
    title: '',
  }
}))
const activeTab = ref<string>(tabs.value[0]?.hash)

const addItem = async () => {
  emit('add')

  if (props.appearance === 'tabs') {
    await nextTick()
    activeTab.value = tabs.value[tabs.value.length - 1]?.hash
  }

  await nextTick()
  focus(realItems.value.length + 1)
}

const removeItem = async (index: number) => {
  emit('remove', index)

  if (props.appearance === 'tabs') {
    activeTab.value = tabs.value[Math.max(0, index - 1)]?.hash
  }
}

const root = useTemplateRef('root')

function focus(index: number) {
  if (!root.value) {
    return
  }

  const i = Math.max(0, Math.min(index, realItems.value.length - 1))
  root.value
    .querySelector<HTMLElement>(`[data-index="${i}"] [data-autofocus]`)
    ?.focus()
}

const stickyTop = computed(() => {
  const { appearance, stickyTabs } = props
  if (appearance !== 'tabs' || stickyTabs == null || stickyTabs === false) {
    return null
  }

  return typeof stickyTabs === 'number'
    ? `${props.stickyTabs}px`
    : typeof stickyTabs === 'string'
      ? stickyTabs
      : '0'
})
</script>

<style lang="scss" scoped>
.ff-array-field {
  display: flex;
  flex-direction: column;
  gap: $kui-space-40;

  &-label {
    margin: 0;
  }

  &-header {
    align-items: center;
    display: flex;
    gap: $kui-space-40;
    height: 32px;
  }

  &-container {
    display: flex;
    flex-direction: column;
    gap: $kui-space-60;
  }

  &-item {
    display: flex;
    padding: $kui-space-50 $kui-space-60;

    &-content {
      display: flex;
      flex-direction: column;
      flex-grow: 1;
      gap: $kui-space-60;
    }
  }

  &-default > &-container > &-item {
    align-items: center;
    flex-direction: row;
    gap: $kui-space-40;
    padding: 0;
  }

  &-card > &-container > &-item :deep(.card-content) {
    align-items: center;
    flex-direction: row;
    gap: $kui-space-40;
  }

  &-tabs &-item {
    flex-direction: column;
    gap: $kui-space-80;
  }

  &-sticky-tabs {
    :deep(.k-tabs ul) {
      background-color: $kui-color-background;
      position: sticky;
      top: v-bind('stickyTop');
      z-index: 10;
    }

    :deep(.k-tabs .tab-link:has(.k-button:hover):hover) {
      background-color: transparent;
    }
  }

  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
