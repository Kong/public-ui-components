<template>
  <div class="field-wrapper">
    <KMultiselect
      :items="realms"
      :loading="isLoadingRealms"
      :model-value="selectedRealms"
      @update:model-value="onRealmsUpdate"
    />
  </div>
</template>

<script lang="ts" setup>
import { computed, inject, onMounted, ref, toRef, watch } from 'vue'
import { useAxios } from '@kong-ui-public/entities-shared'
import { composables, FORMS_CONFIG } from '@kong-ui-public/forms'

import type { MultiselectItem } from '@kong/kongponents'
import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { AxiosResponse } from 'axios'

type IdentityRealmItem = { scope: 'cp', id: null } | { scope: 'realm', id: string }
type KonnectRealmItem = { id: string, name: string }
type KonnectRealmResponse = { data: KonnectRealmItem[], meta: { next: string | null } }

const props = defineProps<{
  disabled?: boolean
  formOptions?: Record<string, any>
  model?: Record<string, any>
  schema: Record<string, any>
  vfg: Record<string, any>
  errors?: Array<any>
  hint?: string
}>()

const emit = defineEmits<{
  (event: 'modelUpdated', value: any, model: Record<string, any>): void
}>()

const { clearValidationErrors, value: fieldValue } = composables.useAbstractFields<IdentityRealmItem[]>({
  model: toRef(() => props.model),
  schema: props.schema,
  formOptions: props.formOptions,
  emitModelUpdated: (data: { value: any, model: Record<string, any> }): void => {
    emit('modelUpdated', data.value, data.model)
  },
})

const kCurrentCPSelectItem = { label: 'Current Control Plane', group: 'Control Plane', value: 'current-cp' } as const

const formConfig = inject<KonnectBaseFormConfig | KongManagerBaseFormConfig | undefined>(FORMS_CONFIG)
const { axiosInstance } = useAxios(formConfig?.axiosRequestConfig)

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
        items.push(...resp.data.data.map((realm) => ({ value: realm.id, label: realm.name, group: 'Realms' })))
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

const selectedRealms = computed(() => fieldValue.value.map((realm) => realm.id || 'current-cp'))

const onRealmsUpdate = (currentSelected: string[]) => {

  const nextCPSlice = currentSelected.includes('current-cp')
    ? [{ scope: 'cp', id: null } as const] : []

  const prevKonnectRealmSelection = fieldValue.value
    .filter(({ scope }) => scope !== 'cp')
    .map(({ id }) => id!)

  const currentKonnectRealmSelection = currentSelected.filter(id => id !== 'current-cp')

  const konnectRealmHasChange = prevKonnectRealmSelection.length !== currentKonnectRealmSelection.length
    || prevKonnectRealmSelection.some((id) => !currentKonnectRealmSelection.includes(id))

  const nextKonnectRealmId = konnectRealmHasChange
    ? currentKonnectRealmSelection.filter((realmId) => !prevKonnectRealmSelection.includes(realmId))
    : currentKonnectRealmSelection

  const nextKonnectRealms = nextKonnectRealmId.map((id) => ({ scope: 'realm', id } as const))

  fieldValue.value = [
    ...nextCPSlice,
    ...nextKonnectRealms,
  ]
}

// set default value if the value is not initialized
watch(fieldValue, () => {
  if (!fieldValue.value) {
    fieldValue.value = [{ scope: 'cp', id: null }]
  }
})

onMounted(() => {
  fetchRealms()
})

defineExpose({
  clearValidationErrors,
})
</script>

<style lang="scss" scoped>
.field-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}
</style>
