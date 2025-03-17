<template>
  <div class="consumer-realm-select">
    <KLabel
      class="ream-select-label"
      :for="selectId"
    >
      {{ t('consumers.list.realm_select.label') }}
    </KLabel>
    <KSelect
      :id="selectId"
      :items="realms"
      :loading="loading"
      width="200"
    />
  </div>
</template>

<script setup lang="ts">
import { onBeforeMount, ref, useId } from 'vue'
import type { PropType } from 'vue'
import { useAxios } from '@kong-ui-public/entities-shared'
import type { AxiosRequestConfig } from 'axios'
import composables from '../composables'

const { i18n: { t } } = composables.useI18n()

const props = defineProps({
  axiosRequestConfig: {
    type: Object as PropType<AxiosRequestConfig>,
    default: () => {},
  },
})

const selectId = useId()

const { axiosInstance } = useAxios(props?.axiosRequestConfig)

const loading = ref<boolean>(false)
const realms = ref<any[]>([])

const fetchRealms = async () => {
  loading.value = true

  try {
    const baseUrl = '/v1/realms'
    const res = await axiosInstance.get(baseUrl)
    console.log(res)
  } catch (error) {
    console.error('Error fetching realms', error)
  } finally {
    loading.value = false
  }
}

onBeforeMount(() => {
  fetchRealms()
})
</script>

<style lang="scss" scoped>
.consumer-realm-select {
  display: flex;
  align-items: center;
  gap: $kui-space-50;

  .ream-select-label {
    margin-bottom: $kui-space-0;
  }
}
</style>
