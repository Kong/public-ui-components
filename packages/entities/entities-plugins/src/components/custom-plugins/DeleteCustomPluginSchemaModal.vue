<template>
  <EntityDeleteModal
    v-if="!isPluginSchemaInUse && plugin"
    :action-pending="isLoading"
    class="delete-custom-plugin-schema-modal"
    data-testid="delete-custom-plugin-schema-modal"
    :description="t('delete.description_custom')"
    :entity-name="plugin.name"
    :entity-type="EntityTypes.Plugin"
    :error="errorMessage"
    need-confirm
    :title="title"
    visible
    @cancel="$emit('closed')"
    @proceed="handleSubmit"
  />

  <KPrompt
    v-else-if="plugin"
    :action-pending="isLoading"
    class="delete-custom-plugin-schema-modal"
    data-testid="delete-custom-plugin-schema-modal"
    is-visible
    :title="title"
    type="warning"
    @canceled="$emit('closed')"
  >
    <template #body-content>
      <div>
        <i18n-t
          keypath="delete.plugin_schema_in_use_message"
          tag="p"
        >
          <template #name>
            <strong>{{ plugin.name }}</strong>
          </template>
        </i18n-t>
      </div>
    </template>
    <template #action-buttons>
      <div>
        <KButton
          appearance="outline"
          class="cancel-button"
          data-testid="delete-custom-plugin-form-cancel"
          @click="$emit('closed')"
        >
          {{ t('actions.cancel') }}
        </KButton>
      </div>
    </template>
  </KPrompt>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from 'vue'
import {
  type KongManagerPluginSelectConfig,
  type KonnectPluginSelectConfig,
} from '../../types'
import composables from '../../composables'
import { useAxios, useErrors, EntityTypes, EntityDeleteModal } from '@kong-ui-public/entities-shared'

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectPluginSelectConfig | KongManagerPluginSelectConfig>,
    required: true,
    validator: (config: KonnectPluginSelectConfig | KongManagerPluginSelectConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      return true
    },
  },
  plugin: {
    type: Object as PropType<{ name: string, id: string }>,
    required: true,
  },
})

const emit = defineEmits(['closed', 'proceed'])

const { i18nT, i18n: { t } } = composables.useI18n()
const { getMessageFromError } = useErrors()

const { axiosInstance } = useAxios({
  headers: props.config?.requestHeaders,
})

const title = computed((): string => {
  return isPluginSchemaInUse.value
    ? t('delete.plugin_schema_in_use_title')
    : t('delete.title', { name: props.plugin?.name || t('delete.custom_plugin') })
})

const isLoading = ref(false)
const errorMessage = ref('')
const isPluginSchemaInUse = ref(false)

const handleSubmit = async (): Promise<void> => {
  isLoading.value = true
  errorMessage.value = ''

  if (!props.plugin?.name || props.config?.app !== 'konnect') {
    return
  }

  try {
    const url = `${props.config.apiBaseUrl}/api/runtime_groups/${props.config.controlPlaneId}/v1/plugin-schemas/${props.plugin?.name}`
    await axiosInstance.delete(url)

    emit('proceed')
  } catch (err: any) {
    const { response } = err

    if (
      response?.status === 400 &&
      response.data?.message?.includes('plugin schema is currently in use')
    ) {
      isPluginSchemaInUse.value = true
    } else {
      errorMessage.value = getMessageFromError(err)
    }
  } finally {
    isLoading.value = false
  }
}
</script>

<style lang="scss" scoped>
.delete-custom-plugin-schema-modal {
  & :deep(.k-modal-dialog) {
    max-width: 550px;
  }
}

.error-wrapper {
  margin-bottom: $kui-space-60;
}

.confirm-text {
  margin-bottom: $kui-space-40;
}

.cancel-button {
  margin-right: $kui-space-40;
}
</style>
