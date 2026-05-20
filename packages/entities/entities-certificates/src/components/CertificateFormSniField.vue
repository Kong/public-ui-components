<template>
  <div class="sni-field-container">
    <KLabel :info="t('certificates.form.fields.snis.tooltip')">
      {{ t('certificates.form.fields.snis.label') }}
    </KLabel>

    <template v-if="isEditing">
      <template
        v-for="_, index in fieldsValue"
        :key="index"
      >
        <KInput
          v-if="fieldsValue[index]"
          v-model.trim="fieldsValue[index]"
          :data-testid="`sni-field-input-${index + 1}`"
          disabled
          :placeholder="t('certificates.form.fields.snis.placeholder')"
        />
      </template>
      <i18nT keypath="certificates.form.fields.snis.editingTip">
        <template #link>
          <router-link :to="sniListRoute">
            {{ t('certificates.form.fields.snis.editingTipLink') }}
          </router-link>
        </template>
      </i18nT>
    </template>

    <template v-else>
      <div
        v-for="_, index in fieldsValue"
        :key="index"
        class="sni-field-row"
      >
        <KInput
          v-model.trim="fieldsValue[index]"
          :data-testid="`sni-field-input-${index + 1}`"
          :placeholder="t('certificates.form.fields.snis.placeholder')"
        />
        <KButton
          appearance="tertiary"
          class="sni-remove-button"
          :data-testid="`remove-sni-${index + 1}`"
          icon
          @click="$emit('remove', index)"
        >
          <CloseIcon />
        </KButton>
      </div>

      <KButton
        appearance="tertiary"
        class="sni-add-button"
        data-testid="add-sni"
        @click="$emit('add')"
      >
        <AddIcon />
        {{ t('certificates.form.fields.snis.add') }}
      </KButton>
    </template>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { ref, watch } from 'vue'
import type { RouteLocationRaw } from 'vue-router'
import { CloseIcon, AddIcon } from '@kong/icons'
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
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  .sni-field-row {
    align-items: center;
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);

    .sni-remove-button {
      flex-shrink: 0;
    }

    :deep(.k-input) {
      flex: 1;
    }
  }

  .sni-add-button {
    align-self: flex-start;
  }
}
</style>
