<template>
  <KMultiselect
    :items="realms"
    :loading="isLoadingRealms"
    :model-value="selectedRealms"
    @update:model-value="onRealmsUpdate"
  />
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, ref } from 'vue'
import { useAxios } from '@kong-ui-public/entities-shared'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import composables from '../../../composables'

import type { MultiselectItem } from '@kong/kongponents'
import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { AxiosResponse } from 'axios'
import type { IdentityRealmItem } from './types'

type KonnectRealmItem = { id: string, name: string }
type KonnectRealmResponse = { data: KonnectRealmItem[], meta: { next: string | null } }

defineOptions({ name: 'KeyAuthIdentityRealmsBase' })

const emit = defineEmits<{
  (event: 'modelUpdated', value: IdentityRealmItem[], model: Record<string, any>): void
}>()

const model = defineModel<IdentityRealmItem[]>({
  default: [{ scope: 'cp', id: null, region: null }],
})

const { i18n } = composables.useI18n()
const { t } = i18n

const kCurrentCPSelectItem = {
  value: 'current-cp',
  label: t('custom_field.key_auth_identity_realms.cp_label'),
  group: t('custom_field.key_auth_identity_realms.cp_group_label'),
} as const

const formConfig = inject<KonnectBaseFormConfig | KongManagerBaseFormConfig | undefined>(FORMS_CONFIG)
const { axiosInstance } = useAxios(formConfig?.axiosRequestConfig)

// workaround for the fact that the DP does not support the region: null now
// we should remove this line when the DP supports it
const guessRegion = () => {
  if (formConfig?.app === 'konnect') {
    const regionMatch = /\b(us|eu|au|me|in)\b/.exec(formConfig?.apiBaseUrl || '')
    if (regionMatch) {
      return { region: regionMatch[1] }
    }
  }
  return {}
}

const isLoadingRealms = ref<boolean>(true)
const realms = ref<MultiselectItem[]>([kCurrentCPSelectItem])

const fetchRealms = async (): Promise<void> => {
  if (formConfig?.app !== 'konnect') {
    return
  }

  try {
    isLoadingRealms.value = true
    let nextUrl: string | null = `${formConfig?.apiBaseUrl}/v1/realms`
    const items: MultiselectItem[] = []

    do {
      const resp: AxiosResponse<KonnectRealmResponse> = await axiosInstance.get(nextUrl)
      if (resp && resp.data && resp.data.data) {
        items.push(...resp.data.data.map((realm) => ({
          value: realm.id,
          label: realm.name,
          group: t('custom_field.key_auth_identity_realms.realm_group_label'),
        })))
      }
      nextUrl = resp.data.meta.next ? `${formConfig?.apiBaseUrl}${resp.data.meta.next}` : null
    } while (nextUrl)

    realms.value = [kCurrentCPSelectItem, ...items]
  } catch (e) {
    console.error('Failed to fetch Konnect realms', e)
  } finally {
    isLoadingRealms.value = false
  }
}

const selectedRealms = computed(() => model.value.map((realm) => realm.id || 'current-cp'))

const onRealmsUpdate = (currentSelected: string[]) => {

  const nextCPSlice = currentSelected.includes('current-cp')
    ? [{ scope: 'cp', id: null, region: null } as const] : []

  const prevKonnectRealmSelection = model.value
    .filter(({ scope }) => scope !== 'cp')
    .map(({ id }) => id!)

  const currentKonnectRealmSelection = currentSelected.filter(id => id !== 'current-cp')

  const konnectRealmHasChange = prevKonnectRealmSelection.length !== currentKonnectRealmSelection.length
    || prevKonnectRealmSelection.some((id) => !currentKonnectRealmSelection.includes(id))

  const nextKonnectRealmId = konnectRealmHasChange
    ? currentKonnectRealmSelection.filter((realmId) => !prevKonnectRealmSelection.includes(realmId))
    : currentKonnectRealmSelection

  const nextKonnectRealms = nextKonnectRealmId.map((id) => ({ ...guessRegion(), scope: 'realm', id } as const))

  model.value = [
    ...nextCPSlice,
    ...nextKonnectRealms,
  ]
}

onMounted(() => {
  fetchRealms()
})
</script>
