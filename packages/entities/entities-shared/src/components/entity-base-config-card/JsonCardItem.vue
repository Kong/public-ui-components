<template>
  <component
    :is="isArrayItem ? 'fieldset' : 'div'"
    :class="isArrayItem ? 'config-card-fieldset' : 'config-card-json-item'"
  >
    <legend
      v-if="isArrayItem"
      class="config-card-fieldset-title"
    >
      <b>{{ heading }}</b>
    </legend>
    <ConfigCardItem
      v-for="(property, idx) in Object.keys(displayValue)"
      :key="`${key}-property-${idx}`"
      :item="{
        key: property,
        label: convertKeyToTitle(property),
        value: displayValue[property],
      }"
    />
  </component>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed } from 'vue'
import type { RecordItem } from '../../types'
import composables from '../../composables'
import ConfigCardItem from './ConfigCardItem.vue'

const props = defineProps({
  item: {
    type: Object as PropType<RecordItem | Record<string, any>>,
    required: true,
  },
  index: {
    type: Number,
    default: -1,
  },
  isArrayItem: {
    type: Boolean,
    default: false,
  },
})

const { i18n: { t } } = composables.useI18n()
const { convertKeyToTitle } = composables.useStringHelpers()

const key = computed((): string => props.item.key ?? 'json-array-item')
const rawValue = computed((): Record<string, any> => {
  return props.item.value ?? props.item
})
const displayValue = computed((): Record<string, any> => {
  const rec = JSON.parse(JSON.stringify(rawValue.value))

  // we'll display the name as a heading so don't show the prop
  if (props.isArrayItem) {
    delete rec.name
  }

  return rec
})
const heading = computed((): string => {
  if (!props.isArrayItem) {
    return ''
  }

  return rawValue.value?.name ? convertKeyToTitle(rawValue.value.name, '_') : t('baseConfigCard.general.entryTitle', { index: props.index })
})
</script>

<style lang="scss" scoped>
.config-card-fieldset {
  border: solid var(--kui-border-width-10, $kui-border-width-10) var(--kui-color-border, $kui-color-border);
  border-radius: 4px;
  margin-bottom: var(--kui-space-40, $kui-space-40);
  margin-top: 4px;
}

.config-card-fieldset-title {
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  padding: 0 var(--kui-space-40, $kui-space-40);
  width: auto;
}
</style>

<style lang="scss">
fieldset.config-card-fieldset {
  .config-card-details-row {
    width: unset;
  }
}

.config-card-json-item, fieldset.config-card-fieldset {
  .config-card-details-row {
    margin: var(--kui-space-0, $kui-space-0) var(--kui-space-60, $kui-space-60);

    &:last-of-type {
      border-bottom: none;
    }
  }
}
</style>
