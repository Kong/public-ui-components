<template>
  <div class="sni-field-container">
    <KLabel :info="t('certificates.form.fields.snis.tooltip')">
      {{ t('certificates.form.fields.snis.label') }}
    </KLabel>
    <div
      v-for="_, index in fieldsValue"
      :key="index"
      class="sni-field-input"
    >
      <KInput
        v-if="!isEditing || fieldsValue[index]"
        v-model.trim="fieldsValue[index]"
        :data-testid="`sni-field-input-${index + 1}`"
        :disabled="isEditing"
        :placeholder="t('certificates.form.fields.snis.placeholder')"
      />
      <div
        v-if="!isEditing"
        class="sni-field-controls-container"
      >
        <KButton
          appearance="tertiary"
          class="remove-button"
          data-testid="remove-sni"
          icon
          @click="$emit('remove', index)"
        >
          <TrashIcon
            :color="KUI_COLOR_TEXT_DANGER"
          />
        </KButton>
        <KButton
          appearance="tertiary"
          data-testid="add-sni"
          :disabled="index !== fieldsValue.length - 1"
          icon
          @click="$emit('add')"
        >
          <AddIcon />
        </KButton>
      </div>
    </div>
    <div
      v-if="fieldsValue.length === 0"
    >
      <KButton
        @click="$emit('add')"
      >
        {{ t('certificates.form.fields.snis.add') }}
      </KButton>
    </div>
    <i18nT
      v-if="isEditing"
      keypath="certificates.form.fields.snis.editingTip"
    >
      <template #link>
        <router-link :to="sniListRoute">
          {{ t('certificates.form.fields.snis.editingTipLink') }}
        </router-link>
      </template>
    </i18nT>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { KUI_COLOR_TEXT_DANGER } from '@kong/design-tokens'
import { TrashIcon, AddIcon } from '@kong/icons'
import composables from '../composables'

type FieldsValue = string[]

const props = defineProps({
  isEditing: {
    type: Boolean,
    default: false,
  },
  modelValue: {
    type: Array as PropType<FieldsValue>,
    required: true,
  },
  sniListRoute: {
    type: Object as PropType<RouteLocationRaw>,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'add'): void
  (e: 'remove', index: number): void
  (e: 'update:modelValue', value: FieldsValue): void
}>()

const { i18nT, i18n: { t } } = composables.useI18n()

const fieldsValue = ref<FieldsValue>([])

watch(props.modelValue, (value) => {
  fieldsValue.value = [...value]
}, { immediate: true, deep: true })

watch(fieldsValue, (value) => {
  emit('update:modelValue', value)
}, { deep: true })
</script>

<style lang="scss" scoped>
.sni-field-container {
  .sni-field-input {
    align-items: center;
    display: flex;
    gap: var(--kui-space-80, $kui-space-80);

    &:not(:last-child) {
      margin-bottom: var(--kui-space-60, $kui-space-60);
    }
  }

  .sni-field-controls-container {
    display: flex;
    gap: var(--kui-space-20, $kui-space-20);
  }
}
</style>
