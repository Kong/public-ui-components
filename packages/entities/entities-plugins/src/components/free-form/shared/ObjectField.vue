<template>
  <div
    class="ff-object-field"
    :class="{ 'ff-object-field-collapsed': !realExpanded }"
  >
    <header class="ff-object-field-header">
      <KLabel
        class="ff-object-field-label"
        v-bind="labelAttributes"
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
      <div class="ff-object-field-actions">
        <KButton
          v-if="collapsible && realAdded"
          appearance="tertiary"
          :class="`ff-object-field-button-${realExpanded ? 'collapse' : 'expand'}`"
          icon
          @click="expanded = !realExpanded"
        >
          <ChevronDownIcon
            v-if="realAdded"
            class="ff-object-field-button-icon"
          />
        </KButton>
        <KButton
          v-if="!required"
          appearance="tertiary"
          :class="`ff-object-field-button-${realAdded ? 'remove' : 'add'}`"
          icon
          @click="added = !added"
        >
          <TrashIcon v-if="realAdded" />
          <AddIcon v-else />
        </KButton>
      </div>
    </header>
    <SlideTransition>
      <div
        v-if="realExpanded"
        class="ff-object-field-content"
      >
        <slot />
      </div>
    </SlideTransition>
  </div>
</template>

<script setup lang="ts">
import { KButton, KLabel, type LabelAttributes } from '@kong/kongponents'
import { TrashIcon, AddIcon, ChevronDownIcon } from '@kong/icons'
import { computed, watch } from 'vue'
import SlideTransition from './SlideTransition.vue'

const { defaultExpanded = true, defaultAdded, collapsible = true, required } = defineProps<{
  label: string
  labelAttributes?: LabelAttributes
  required?: boolean
  defaultExpanded?: boolean
  defaultAdded?: boolean
  collapsible?: boolean
  appearance?: 'card' | 'default'
}>()

const added = defineModel<boolean>('added', { default: undefined })
const realAdded = computed(() => !required ? added.value ?? defaultAdded : true)

const expanded = defineModel<boolean>('expanded', { default: undefined })
const realExpanded = computed(() => realAdded.value && (collapsible ? expanded.value ?? defaultExpanded : false))

watch(realAdded, (value) => {
  if (!collapsible) {
    return
  }
  expanded.value = value
})
</script>

<style lang="scss" scoped>
.ff-object-field {
  &-label {
    margin: 0;
  }

  &-header {
    align-items: center;
    display: flex;
    gap: $kui-space-40;
    height: 32px;
  }

  &-actions {
    align-items: center;
    display: flex;
    gap: $kui-space-20;
  }

  &-button-expand,
  &-button-collapse {
    .ff-object-field-button-icon {
      transition: transform $kui-animation-duration-20 ease-in-out;
    }
  }

  &-button-expand {
    .ff-object-field-button-icon {
      transform: rotate(-90deg);
    }
  }

  &-content {
    display: flex;
    flex-direction: column;
    gap: $kui-space-80;
    margin-top: $kui-space-20;
    padding: $kui-space-60 $kui-space-40 $kui-space-20;
  }

  :deep(.k-tooltip p) {
    margin: 0;
  }
}
</style>
