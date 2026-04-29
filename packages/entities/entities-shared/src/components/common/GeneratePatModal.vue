<template>
  <KModal
    class="generate-pat-modal"
    max-width="640px"
    :title="t('generatePatModal.title')"
    :visible="visible"
    @cancel="handleCancel"
    @proceed="handleGenerate"
  >
    <div>
      {{ t('generatePatModal.description') }}
    </div>

    <KInput
      v-model="tokenName"
      :label="t('generatePatModal.fields.name.label')"
      :placeholder="t('generatePatModal.fields.name.placeholder')"
      required
    />

    <KSelect
      v-model="expirationDays"
      :items="expirationItems"
      :label="t('generatePatModal.fields.expiresAt.label')"
      :placeholder="t('generatePatModal.fields.expiresAt.placeholder')"
      required
    />

    <KAlert
      v-if="errorMessage"
      appearance="danger"
      :message="errorMessage"
    />

    <template #footer-actions>
      <KButton
        appearance="tertiary"
        @click="handleCancel"
      >
        {{ t('generatePatModal.actions.cancel') }}
      </KButton>
      <KButton
        appearance="primary"
        :disabled="!tokenName || isWorking"
        @click="handleGenerate"
      >
        {{ isWorking ? t('generatePatModal.actions.generating') : t('generatePatModal.actions.generate') }}
      </KButton>
    </template>
  </KModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import composables from '../../composables'

const props = defineProps<{
  visible: boolean
  generateKonnectPat: (name: string, expiresAt: Date) => string | Promise<string>
}>()

const emit = defineEmits<{
  generated: [token: string]
  dismiss: []
}>()

const { i18n: { t } } = composables.useI18n()

const tokenName = ref('')
const expirationDays = ref('30')
const isWorking = ref(false)
const errorMessage = ref('')

const expirationItems = [
  { value: '30', label: t('generatePatModal.fields.expiresAt.n_days', { n: 30 }) },
  { value: '60', label: t('generatePatModal.fields.expiresAt.n_days', { n: 60 }) },
  { value: '90', label: t('generatePatModal.fields.expiresAt.n_days', { n: 90 }) },
  { value: '180', label: t('generatePatModal.fields.expiresAt.n_days', { n: 180 }) },
  { value: '365', label: t('generatePatModal.fields.expiresAt.n_days', { n: 365 }) },
]

const handleCancel = () => {
  emit('dismiss')
}

const handleGenerate = async () => {
  if (!tokenName.value) return

  errorMessage.value = ''
  isWorking.value = true

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + Number(expirationDays.value))

  try {
    const token = await props.generateKonnectPat(tokenName.value, expiresAt)
    emit('generated', token)
  } catch (e) {
    console.error('Failed to create PAT:', e)
    errorMessage.value = e instanceof Error ? e.message : String(e)
  } finally {
    isWorking.value = false
  }
}
</script>

<style lang="scss" scoped>
.generate-pat-modal {
  :deep(.modal-content) {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-70, $kui-space-70);
  }
}
</style>
