<template>
  <KPrompt
    class="delete-custom-plugin-schema-modal"
    data-testid="delete-custom-plugin-schema-modal"
    is-visible
    :title="title"
    @canceled="handleCancel"
  >
    <template #body-content>
      <!-- TODO: -->
      <!-- <div v-if="isPluginSchemaInUse">
        <i18n-t
          keypath="configuration.plugins.list.deleteCustomPlugin.pluginSchemaInUseText"
          scope="global"
          tag="p"
        >
          <template #name>
            <strong>{{ plugin?.name }}</strong>
          </template>
        </i18n-t>
      </div> -->

      <!-- TODO: v-else -->
      <div>
        <div
          v-if="errorMessage"
          class="error-wrapper"
          data-testid="error-message"
        >
          <KAlert
            :alert-message="errorMessage"
            appearance="danger"
          />
        </div>
        <form
          id="delete-custom-plugin-form"
          @submit.prevent="handleSubmit"
        >
          <p>
            {{ t('delete.confirmModalText1') }}
            <strong>{{ plugin?.name }}</strong>?
          </p>
          <p>{{ t('delete.confirmModalText2') }}</p>

          <!--   <EntityDeleteModal
      :action-pending="isDeletePending"
      :description="t('delete.description')"
      :entity-name="pluginToBeDeleted && (pluginToBeDeleted.instance_name || pluginToBeDeleted.name || pluginToBeDeleted.id)"
      :entity-type="EntityTypes.Plugin"
      :error="deleteModalError"
      :title="t('delete.title')"
      :visible="isDeleteModalVisible"
      @cancel="hideDeleteModal"
      @proceed="confirmDelete"
    /> -->
          <!-- TODO: just use KPrompt??? -->
          <!-- TODO: i18n-t element instead
            <p class="confirm-text">
            {{ helpText.confirm_1 }} "<strong>{{ plugin?.name }}</strong>" {{ helpText.confirm_2 }}.
          </p> -->
          <KInput
            v-model.trim="customPluginNameFormValue"
            data-testid="confirmation-input"
            type="text"
          />
        </form>
      </div>
    </template>
    <template #action-buttons>
      <div>
        <KButton
          appearance="outline"
          class="cancel-button"
          data-testid="delete-custom-plugin-form-cancel"
          :disabled="isLoading"
          @click="handleCancel"
        >
          {{ t('actions.cancel') }}
        </KButton>
        <KButton
          v-if="isPluginSchemaInUse"
          appearance="primary"
          data-testid="go-to-plugins-list"
          :to="{
            name: 'plugins'
            /*  params: {
              control_plane_id: config.app.controlPlaneId
            } */
          }"
        >
          {{ t('actions.go_to_plugins') }}
        </KButton>
        <KButton
          v-else
          appearance="danger"
          data-testid="delete-custom-plugin-form-submit"
          :disabled="isDeleteButtonDisabled"
          form="delete-custom-plugin-form"
          :icon="isLoading ? 'spinner' : undefined"
          type="submit"
        >
          {{ t('actions.confirm_delete') }}
        </KButton>
      </div>
    </template>
  </KPrompt>
</template>

<script setup lang="ts">
import { ref, computed, type PropType } from 'vue'
import composables from '../composables'
import { useErrors } from '@kong-ui-public/entities-shared'

const props = defineProps({
  plugin: {
    type: Object as PropType<{ name: string, id: string }>,
    required: true,
  },
})

const emit = defineEmits(['closed', 'proceed'])

const { i18n: { t } } = composables.useI18n()
const { getMessageFromError } = useErrors()

const title = computed((): string => {
  return isPluginSchemaInUse.value
    ? t('delete.plugin_schema_in_use_title')
    : t('delete.title', { name: props.plugin?.name || t('delete.custom_plugin') })
})

const isLoading = ref(false)
const errorMessage = ref('')
const customPluginNameFormValue = ref('')
const isPluginSchemaInUse = ref(false)

const handleCancel = (): void => {
  emit('closed')
}

const handleSubmit = async (): Promise<void> => {
  isLoading.value = true
  errorMessage.value = ''

  if (!props.plugin?.id) {
    return
  }

  try {
    // TODO:
    // await customPluginServices.deletePluginSchema(props.plugin?.name)

    emit('proceed')

    // TODO:
    /* notify({
      appearance: 'success',
      message: t('delete.success_message', { name: props.plugin?.name || t('glossary.plugin') }),
    }) */
  } catch (err: any) {
    // TODO: refactor
    const { response } = err
    if (
      response?.status === 400 &&
      response.data?.message &&
      response.data.message.includes('plugin schema is currently in use')
    ) {
      isPluginSchemaInUse.value = true
    } else {
      errorMessage.value = getMessageFromError(err)
    }
  } finally {
    isLoading.value = false
  }
}

const isDeleteButtonDisabled = computed((): boolean => {
  return (
    // TODO:
  /*  currentState.value.matches('pending') || */
    props.plugin?.name !== customPluginNameFormValue.value
  )
})

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
