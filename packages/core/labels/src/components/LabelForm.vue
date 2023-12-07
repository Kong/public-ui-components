<template>
  <div class="label-form">
    <KLabel v-if="props.title">
      {{ props.title }}
    </KLabel>
    <div
      v-for="(item, idx) in labelValue"
      :key="item.id"
      class="runtime-group-prompt-inputs"
    >
      <div class="input-container">
        <KInput
          v-model.trim="item.key"
          :data-testid="`runtime-group-label-prompt-key-${item.id}`"
          :error="labelHasErrors(idx, 'key')"
          :error-message="getLabelErrorMsg(idx, 'key')"
          :placeholder="i18n.t('label_form.key_placeholder')"
        />
      </div>
      <span class="divider">
        :
      </span>
      <div class="input-container">
        <KInput
          v-model.trim="item.value"
          :data-testid="`runtime-group-label-prompt-value-${item.id}`"
          :error="labelHasErrors(idx, 'value')"
          :error-message="getLabelErrorMsg(idx, 'value')"
          :placeholder="i18n.t('label_form.value_placeholder')"
        />
      </div>
      <KButton
        appearance="tertiary"
        class="label-btn-remove"
        :class="{ visible: labelValue.length > MIN_COUNTER_LABELS }"
        :data-testid="`runtime-group-remove-button-label-${item.id}`"
        @click="removeLabel(idx)"
      >
        <KIcon
          class="label-icon-remove"
          icon="close"
          :size="KUI_ICON_SIZE_30"
        />
      </KButton>
    </div>

    <div class="runtime-group-prompt-add-label">
      <KButton
        v-if="labelValue.length < MAX_COUNTER_LABELS"
        appearance="tertiary"
        data-testid="runtime-group-add-button-label"
        icon="plus"
        @click="addLabel"
      >
        {{ i18n.t('label_form.add_label_button_text') }}
      </KButton>

      <KTooltip
        v-else
        :label="i18n.t('label_form.add_label_tooltip_disabled')"
        placement="right"
      >
        <KButton
          appearance="tertiary"
          class="add-label-button-disabled"
          data-testid="runtime-group-add-button-label-disabled"
        >
          <template #icon>
            <KIcon icon="plus" />
          </template>
          {{ i18n.t('label_form.add_label_button_text') }}
        </KButton>
      </KTooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { watch, computed } from 'vue'
import composables from '../composables'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'

import type { Label } from '../types'

const props = defineProps<{
  modelValue: Label[],
  title: string,
  errors: Label[]
}>()

const emit = defineEmits(['update:modelValue'])

const { i18n } = composables.useI18n()
const labelObject = (): Label => {
  return {
    id: Date.now(),
    key: '',
    value: '',
  }
}

const labelValue = computed(() => props.modelValue)
const MAX_COUNTER_LABELS = 5
const MIN_COUNTER_LABELS = 1

const addLabel = (): void => {
  if (labelValue.value.length <= MAX_COUNTER_LABELS) {
    emit('update:modelValue', labelValue.value.concat(labelObject()))
  }
}

const removeLabel = (idx: number): void => {
  if (labelValue.value.length > MIN_COUNTER_LABELS) {
    emit('update:modelValue', labelValue.value.filter((_, index) => index !== idx))
  }
}

const labelHasErrors = (idx: number, type: 'key' | 'value'): boolean => {
  // @ts-ignore
  return props.errors[idx] ? props.errors[idx].errors && !props.errors[idx].errors[type].isValid : false
}

const getLabelErrorMsg = (idx: number, type: 'key' | 'value'): string => {
  // @ts-ignore
  return props.errors[idx] ? props.errors[idx].errors && props.errors[idx].errors[type].failureMessage : ''
}

watch(() => labelValue.value, (newVal) => {
  emit('update:modelValue', newVal)
}, { deep: true })
</script>

<style lang="scss" scoped>
.label-form {
  .runtime-group-prompt-inputs {
    align-items: baseline;
    display: flex;
    height: 70px;
    margin-bottom: $kui-space-60;

    .input-container {
      flex: 1 1 auto;
    }

    .divider {
      margin: $kui-space-0 $kui-space-50;
    }
  }
  .runtime-group-prompt-add-label .btn-link {
    border-radius: $kui-border-radius-0;
    padding: 0;
    &:focus {
      box-shadow: none;
    }
    & .label-icon-plus {
      height: inherit !important;
    }
  }
  .label-btn-remove.k-button.medium {
    margin-left: $kui-space-50;
    padding: 0;
    visibility: hidden;
    &.visible {
      visibility: visible;
    }
  }
  .add-label-button-disabled.k-button.btn-link {
    color: $kui-color-text-neutral-weak;

    cursor: default;
    &:hover {
      text-decoration: none;
    }
  }
  .label-icon-remove {
    height: 16px;
  }
  .flex-fill {
    max-width: 45%;
  }
}
</style>
