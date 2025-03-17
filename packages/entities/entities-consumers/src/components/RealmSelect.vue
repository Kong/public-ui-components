<template>
  <div class="consumer-realm-select">
    <KLabel
      class="ream-select-label"
      :for="selectId"
    >
      {{ t('consumers.list.realm_select.label') }}:
    </KLabel>
    <KSelect
      :id="selectId"
      :key="selectKey"
      v-model="selectedRealm"
      :items="realms"
      :loading="loading"
      width="200"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref, useId, watch } from 'vue'
import type { PropType } from 'vue'
import { useAxios } from '@kong-ui-public/entities-shared'
import type { AxiosRequestConfig } from 'axios'
import composables from '../composables'
import type { SelectItem } from '@kong/kongponents'
import { useErrors } from '@kong-ui-public/entities-shared'

const { i18n: { t } } = composables.useI18n()

const props = defineProps({
  axiosRequestConfig: {
    type: Object as PropType<AxiosRequestConfig>,
    default: () => {},
  },
})

const emit = defineEmits<{
  (e: 'error', errorMessage: string): void
  (e: 'realm-change', realmId: string): void
}>()

const selectId = useId()

const { axiosInstance } = useAxios(props?.axiosRequestConfig)
const { getMessageFromError } = useErrors()

const selectKey = ref<number>(0)
const loading = ref<boolean>(false)
const selectedRealm = ref<string>()
const realms = ref<SelectItem[]>([])

const fetchRealms = async () => {
  loading.value = true

  try {
    const baseUrl = `/v1/realms?${encodeURIComponent('page[size]')}=100`
    const { data: { data } } = await axiosInstance.get(baseUrl)

    if (data && data.length) {
      data.forEach((realm: any) => {
        realms.value.push({
          value: realm.id,
          label: realm.name,
          key: realm.id,
        })
      })
      selectedRealm.value = realms.value[0]?.value as string
      selectKey.value ++
    }
  } catch (error) {
    console.error('Error fetching realms', error)
    emit('error', getMessageFromError(error))
  } finally {
    loading.value = false
  }
}

onBeforeMount(() => {
  fetchRealms()
})

watch(selectedRealm, (newValue) => {
  emit('realm-change', newValue as string)
})
</script>

<style lang="scss" scoped>
.consumer-realm-select {
  align-items: center;
  display: flex;
  gap: $kui-space-50;

  .ream-select-label {
    margin-bottom: $kui-space-0;
  }
}
</style>
