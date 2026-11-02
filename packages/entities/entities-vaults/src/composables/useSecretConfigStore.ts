import { computed, ref, watch } from 'vue'
import type { AxiosError } from 'axios'
import { useAxios } from '@kong-ui-public/entities-shared'
import type { KonnectSecretFormConfig, KonnectSecretListConfig } from '../types'
import endpoints from '../secrets-endpoints'

interface SecretConfigStoreProps {
  config: KonnectSecretFormConfig | KonnectSecretListConfig
  vaultId: string
  configStoreId?: string | null
}

export default function useSecretConfigStore(props: SecretConfigStoreProps, onError: (error: AxiosError) => void) {
  const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
  const fetchedConfigStoreId = ref('')
  const configStoreId = computed(() => props.configStoreId !== undefined
    ? props.configStoreId?.trim() || ''
    : fetchedConfigStoreId.value)

  const storeKey = computed(() => [props.config.app, props.config.apiType, props.config.apiBaseUrl,
    props.config.controlPlaneId, props.config.aiGatewayId, props.config.workspace, props.vaultId, configStoreId.value].join(':'))

  const fetchVaultUrl = computed(() => {
    const endpoint = props.config.apiType === 'aiGateway'
      ? endpoints.getVault.aiGateway
      : endpoints.getVault[props.config.app]
    return `${props.config.apiBaseUrl}${endpoint}`
      .replace(/{aiGatewayId}/gi, props.config.aiGatewayId || '')
      .replace(/{controlPlaneId}/gi, props.config.controlPlaneId || '')
      .replace(/\/{workspace}/gi, props.config.workspace ? `/${props.config.workspace}` : '')
      .replace(/{id}/gi, props.vaultId)
  })

  // Ignore pending Vault responses after an explicit store or business identity changes.
  watch([fetchVaultUrl, () => props.configStoreId], async ([url, explicitId], _, onCleanup) => {
    let current = true
    onCleanup(() => {
      current = false
    })
    fetchedConfigStoreId.value = ''
    if (explicitId !== undefined) return
    try {
      const { data } = await axiosInstance.get(url)
      if (current) fetchedConfigStoreId.value = data?.config?.config_store_id || ''
    } catch (error) {
      if (current) onError(error as AxiosError)
    }
  }, { immediate: true })

  return { configStoreId, storeKey }
}
