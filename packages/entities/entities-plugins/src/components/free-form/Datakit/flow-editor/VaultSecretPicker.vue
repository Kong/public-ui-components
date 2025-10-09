<template>
  <VaultSecretPickerComponent
    v-if="formConfig"
    :additional-disabled="isProceedDisabled"
    :config="formConfig"
    :proceed-button-text="t('plugins.free-form.datakit.flow_editor.vault_secret_picker.proceed_button_text')"
    :setup="secretRef"
    :title="t('plugins.free-form.datakit.flow_editor.vault_secret_picker.title')"
    @cancel="handleCancel"
    @proceed="handleProceed"
  >
    <template #form-prefix>
      <KInput
        v-model:model-value="secretName"
        data-testid="vault-secret-picker-secret-name-input"
        :error="!!validationError"
        :error-message="validationError"
        :label="t('plugins.free-form.datakit.flow_editor.vault_secret_picker.secret_name.label')"
        :label-attributes="{
          info: t('plugins.free-form.datakit.flow_editor.vault_secret_picker.secret_name.help'),
        }"
        :placeholder="t('plugins.free-form.datakit.flow_editor.vault_secret_picker.secret_name.placeholder')"
        required
        @update:model-value="handleUpdate"
      />
    </template>
  </VaultSecretPickerComponent>
  <KEmptyState
    v-else
    icon-variant="error"
    :message="t('plugins.free-form.vault_picker.component_error')"
  />
</template>

<script setup lang="ts">
import { inject, ref, computed } from 'vue'
import { VaultSecretPicker as VaultSecretPickerComponent } from '@kong-ui-public/entities-vaults'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import type { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'
import composables from '../../../../composables'

const {
  secretRef,
  secretName: propSecretName,
  validateName = () => undefined,
  isEditing = false,
} = defineProps<{
  secretRef?: string | false
  secretName?: string
  validateName?: (secretName: string, isEditing: boolean) => string | undefined
  isEditing?: boolean
}>()

const emit = defineEmits<{
  proceed: [data: { secretRef: string, secretName: string }]
  cancel: []
}>()

const { i18n: { t } } = composables.useI18n()

const formConfig = inject<KonnectBaseFormConfig | KongManagerBaseFormConfig | undefined>(FORMS_CONFIG)

const secretName = ref(propSecretName || '')
const validationError = ref('')

const isSecretNameValid = computed(() => {
  if (!secretName.value.trim()) return false
  return validateName(secretName.value.trim(), isEditing) === undefined
})

const isProceedDisabled = computed(() => {
  return !isSecretNameValid.value
})

const validateSecretName = (): boolean => {
  const trimmedName = secretName.value.trim()

  const error = validateName(trimmedName, isEditing)
  validationError.value = error || ''

  return error === undefined
}

const handleUpdate = () => {
  validationError.value = ''
  validateSecretName()
}

const handleProceed = (vaultSecretRef: string) => {
  if (validateSecretName()) {
    emit('proceed', {
      secretRef: vaultSecretRef,
      secretName: secretName.value.trim(),
    })
  }
}

const handleCancel = () => {
  secretName.value = ''
  validationError.value = ''
  emit('cancel')
}
</script>
