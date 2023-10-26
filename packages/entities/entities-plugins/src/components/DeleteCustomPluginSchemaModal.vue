<template>
  <KPrompt
    class="delete-custom-plugin-schema-modal"
    data-testid="delete-custom-plugin-schema-modal"
    is-visible
    :title="title"
    @canceled="handleCancel"
  >
    <template #body-content>
      <div v-if="isPluginSchemaInUse">
        <i18n-t
          keypath="configuration.plugins.list.deleteCustomPlugin.pluginSchemaInUseText"
          scope="global"
          tag="p"
        >
          <template #name>
            <strong>{{ plugin?.name }}</strong>
          </template>
        </i18n-t>
      </div>
      <div v-else>
        <div
          v-if="currentState.matches('error')"
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
            {{ helpText.confirmModalText1 }}
            <strong>{{ plugin?.name }}</strong>?
          </p>
          <p>{{ helpText.confirmModalText2 }}</p>
          <p class="confirm-text">
            {{ helpText.confirm_1 }} "<strong>{{ plugin?.name }}</strong>" {{ helpText.confirm_2 }}.
          </p>
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
          :disabled="currentState.matches('pending')"
          @click="handleCancel"
        >
          {{ helpText.cancel }}
        </KButton>
        <KButton
          v-if="isPluginSchemaInUse"
          appearance="primary"
          data-testid="go-to-plugins-list"
          :to="{
            name: 'plugins',
            params: {
              control_plane_id: controlPlaneId
            }
          }"
        >
          {{ helpText.goToPlugins }}
        </KButton>
        <KButton
          v-else
          appearance="danger"
          data-testid="delete-custom-plugin-form-submit"
          :disabled="isDeleteButtonDisabled"
          form="delete-custom-plugin-form"
          :icon="currentState.matches('pending') ? 'spinner' : null"
          type="submit"
        >
          {{ helpText.confirm }}
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
    type: Object as PropType<{name: string, id: string}>,
    required: true,
  },
})

const emit = defineEmits(['closed', 'proceed'])

const { i18n: { t } } = composables.useI18n()
const { getMessageFromError } = useErrors()

const title = computed((): string => {
  return isPluginSchemaInUse.value
    ? t('configuration.plugins.list.deleteCustomPlugin.pluginSchemaInUseTitle', { name: props.plugin?.name })
    : `${t('actions.delete')} ${props.plugin?.name || 'plugin'}`
})

const errorMessage = ref('')
const customPluginNameFormValue = ref('')
const isPluginSchemaInUse = ref(false)

const handleCancel = (): void => {
  emit('closed')
}

const handleSubmit = async (): Promise<void> => {
  if (!props.plugin?.id) {
    return
  }

  try {
    // TODO:
    // await customPluginServices.deletePluginSchema(props.plugin?.name)

    emit('proceed')

    /* notify({
      appearance: 'success',
      message: i18n.t('configuration.plugins.list.deleteCustomPlugin.successMessage', { name: props.plugin?.name }),
    }) */
  } catch (err) {
    if (
      err.response?.status === 400 &&
      err.response.data?.message &&
      err.response.data.message.includes('plugin schema is currently in use')
    ) {
      isPluginSchemaInUse.value = true

    } else {
      errorMessage.value = getMessageFromError(err)
    }
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
