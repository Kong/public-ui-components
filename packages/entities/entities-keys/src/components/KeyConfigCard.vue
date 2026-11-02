<template>
  <EntityBaseConfigCard
    :config="config"
    :config-card-doc="configCardDoc"
    :entity-type="SupportedEntityType.Key"
    :fetch-url="fetchUrl"
    :hide-title="hideTitle"
    @fetch:error="(err: any) => emit('fetch:error', err)"
    @fetch:success="handleSuccess"
    @loading="(val: boolean) => emit('loading', val)"
  >
    <template #default="{ record, config: viewConfig }">
      <KeyConfigCardView
        v-bind="props"
        :config="viewConfig"
        :key-set="{ id: record.set?.id || keySetId || '', name: keySetName, loading: isKeySetNameLoading }"
        :record="record"
        @error:parse="(err: any) => emit('fetch:error', err)"
        @navigation-click="(id: string, entityType: any) => emit('navigation-click', id, entityType)"
      >
        <template
          v-for="slotKey in Object.keys($slots)"
          :key="slotKey"
          #[slotKey]="slotProps"
        >
          <slot
            :name="slotKey"
            v-bind="slotProps"
          />
        </template>
      </KeyConfigCardView>
    </template>
  </EntityBaseConfigCard>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, watch } from 'vue'
import type { AxiosError } from 'axios'
import { EntityBaseConfigCard, SupportedEntityType, useAxios } from '@kong-ui-public/entities-shared'
import type { KongManagerKeyEntityConfig, KonnectKeyEntityConfig } from '../types'
import endpoints from '../keys-endpoints'
import KeyConfigCardView from './KeyConfigCardView.vue'
const emit = defineEmits<{
  (e: 'loading', isLoading: boolean): void
  (e: 'fetch:error', error: AxiosError): void
  (e: 'fetch:success', data: Record<string, any>): void
  (e: 'navigation-click', id: string, entityType: string): void
}>()

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectKeyEntityConfig | KongManagerKeyEntityConfig>,
    required: true,
    validator: (config: KonnectKeyEntityConfig | KongManagerKeyEntityConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && typeof config.workspace !== 'string') return false
      if (!config.entityId) return false
      return true
    },
  },
  /**
   * External link for documentation that determines visibility of Documentation button
   */
  configCardDoc: {
    type: String,
    default: '',
    required: false,
  },
  /**
   * Control visibility of card title content
   */
  hideTitle: {
    type: Boolean,
    default: false,
  },
  /**
   * Keyset id for scoped key entity
   */
  keySetId: {
    type: String as PropType<string | null>,
    default: null,
  },
})
const fetchUrl = computed<string>(() => {
  if (props.keySetId) {
    return `${endpoints.form[props.config.app].edit.forKeySet}`
      .replace(/{keySetId}/gi, props.keySetId)
  }
  return endpoints.form[props.config.app].edit.all
})
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const fetchKeySetNameUrl = computed<string>(() => endpoints.form[props.config.app]?.getKeySet)

const entityKeySetId = ref<string>(props.keySetId || '')
const keySetName = ref('')
const isKeySetNameLoading = ref(false)

const handleSuccess = async (entity: any) => {
  entityKeySetId.value = entity?.set?.id
  emit('fetch:success', entity)
}

watch(entityKeySetId, async () => {
  if (!entityKeySetId.value) {
    return
  }

  let url = `${props.config.apiBaseUrl}${fetchKeySetNameUrl.value}`
  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  }

  url = url
    .replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
    .replace(/{keySetId}/gi, entityKeySetId.value || '')

  try {
    isKeySetNameLoading.value = true
    // make the call to get keySetName
    const { data } = await axiosInstance.get(url, {
      validateStatus: (status: number) => status === 404 || (status >= 200 && status < 300), // in case KeySet is deleted
    })
    keySetName.value = data?.name || data?.id
  } catch (err: any) {
    // emit this error for the host app
    emit('fetch:error', err)
  } finally {
    isKeySetNameLoading.value = false
  }
}, { immediate: true })


</script>
