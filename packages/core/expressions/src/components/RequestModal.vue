<template>
  <KModal
    action-button-text="Add"
    text-align="left"
    :title="i18n.t('requestModal.title')"
    :visible="props.visible"
    @cancel="emit('dismiss', false)"
    @proceed="handleProceed"
  >
    <KInput
      v-model="url"
      class="url-input"
      data-testid="url-input"
      :error="urlHasError"
      :error-message="urlErrorMessage"
      :help="i18n.t('requestModal.help', { protocols: Array.from(supportedProtocols.values()).join(i18n.t('comma')) } )"
      label="URL"
      placeholder="URL"
    />

    <VueFormGenerator
      class="request-form"
      :model="model"
      :options="options"
      :schema="ADD_REQUEST_SCHEMA"
    />

    <KAlert
      v-if="errorMessage"
      appearance="danger"
      data-testid="request-modal-error"
      :message="errorMessage"
    />
  </KModal>
</template>

<script setup lang="ts">
import { HTTP_PROTOCOLS, SUPPORTED_PROTOCOLS, SECURED_PROTOCOLS, type Request } from '../definitions'
import { reactive, ref, watch } from 'vue'
import { transformCheckRequest } from '../utils'
import { VueFormGenerator } from '@kong-ui-public/forms'
import composables from '../composables'
import '@kong-ui-public/forms/dist/style.css'

const { i18n } = composables.useI18n()

const options = {
  'noneSelectedText': i18n.t('requestModal.noneSelectedText'),
  'helpAsHtml': true,
}

const ADD_REQUEST_SCHEMA = {
  fields: [{
    label: i18n.t('request.Method'),
    type: 'select',
    inputType: 'text',
    required: true,
    default: 'GET',
    selectOptions: {
      hideNoneSelectedText: true,
    },
    placeholder: i18n.t('requestModal.methodInputPlaceholder'),
    values: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    id: 'method',
    model: 'method',
    order: 0,
    visible: (model: Partial<Request>) => {
      const isVisible = model.protocol !== undefined && HTTP_PROTOCOLS.has(model.protocol)
      if (!isVisible) {
        model.method = undefined
      }

      return isVisible
    },
  },
  {
    label: i18n.t('request.Headers'),
    type: 'object-advanced',
    submitWhenNull: true,
    placeholder: i18n.t('requestModal.headersInputPlaceholder'),
    buttonLabel: i18n.t('requestModal.headerButtonLabel'),
    hintText: i18n.t('requestModal.headerHint'),
    fields: [
      {
        schema: {
          type: 'input',
          inputType: 'text',
          valueType: 'array',
          placeholder: i18n.t('requestModal.headerValueInputPlaceholder'),
          hint: i18n.t('requestModal.headerValueHint'),
        },
      },
    ],
    id: 'headers',
    model: 'headers',
    order: 0,
    visible: (model: Partial<Request>) => {
      const isVisible = model.protocol !== undefined && SUPPORTED_PROTOCOLS.has(model.protocol)
      if (!isVisible) {
        model.headers = undefined
      }

      return isVisible
    },
  },
  {
    label: i18n.t('request.SNI'),
    name: 'sni',
    type: 'input',
    inputType: 'text',
    submitWhenNull: true,
    placeholder: i18n.t('requestModal.sniPlaceholder'),
    id: 'sni',
    model: 'sni',
    order: 0,
    visible: (model: Partial<Request>) => {
      const isVisible = model.protocol !== undefined && SECURED_PROTOCOLS.has(model.protocol)
      if (!isVisible) {
        model.sni = undefined
      }

      return isVisible
    },
  }],
}

const supportedProtocols = new Set(['http', 'https', 'grpc', 'grpcs', 'ws', 'wss'])

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  dismiss: [completed: boolean]
  addRequest: [request: Request]
}>()

const url = ref('')
const errorMessage = ref<string | undefined>(undefined)
const model = reactive<Partial<Request>>({})

const urlHasError = ref<boolean>(false)
const urlErrorMessage = ref<string | undefined>(undefined)

const handleProceed = () => {
  try {
    const err = transformCheckRequest(model)
    if (err !== undefined) {
      throw new Error(i18n.t('requestModal.invalidRequest', { err }))
    }

    emit('addRequest', model as Request)
    emit('dismiss', true)

  } catch (err: unknown) {
    errorMessage.value = (err as Error).message
  }
}

watch(url, (url) => {
  try {
    let u = new URL(url)
    const protocol = u.protocol.replace(/:$/g, '')
    if (!supportedProtocols.has(protocol)) {
      throw new Error(i18n.t('requestModal.unsupportedProtocol', { protocols: Array.from(supportedProtocols.values()).join(i18n.t('comma')) }))
    }

    // Handle URLs with grpc-protocol family specially
    if (['grpc', 'grpcs'].includes(protocol)) {
      u = new URL(`http:${u.pathname}`)
    }

    model.protocol = protocol
    model.host = u.hostname
    model.port = u.port ? Number.parseInt(u.port) : ['https', 'grpcs', 'wss'].includes(protocol) ? 443 : 80
    model.path = u.pathname

    urlHasError.value = false
    urlErrorMessage.value = undefined

  } catch (e: any) {
    model.protocol = undefined
    model.host = undefined
    model.port = undefined
    model.path = undefined

    urlErrorMessage.value = e.message
    urlHasError.value = true
  }
})
</script>

<style scoped lang="scss">
.url-input {
  margin-bottom: var(--kui-space-90, $kui-space-90);
  width: 100%;
}

.request-form {
  :deep(fieldset) {
    border: 0;
    padding: 0;
  }
}
</style>
