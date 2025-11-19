import { ref } from 'vue'

export const useVaultSecretPicker = () => {
  const vaultSecretPickerSetup = ref<string | false>()
  const vaultSecretPickerAutofillAction = ref<(secretRef: string) => void | undefined>()
  const setUpVaultSecretPicker = (setupValue: string, autofillAction: (secretRef: string) => void) => {
    vaultSecretPickerSetup.value = setupValue ?? ''
    vaultSecretPickerAutofillAction.value = autofillAction
  }
  const handleVaultSecretPickerAutofill = (secretRef: string) => {
    vaultSecretPickerAutofillAction.value?.(secretRef)
    vaultSecretPickerSetup.value = false
  }

  return {
    vaultSecretPickerSetup,
    setUpVaultSecretPicker,
    handleVaultSecretPickerAutofill,
  }
}
