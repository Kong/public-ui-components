<template>
  <Form
    ref="form"
    :data="formData"
    :schema="schema"
  >
    <NameField
      :name="formData.name"
      :validate="nameValidator"
      @update="setName"
    />

    <KLabel class="dk-node-configuration-label">
      {{ t('plugins.free-form.datakit.flow_editor.node_properties.configuration') }}
    </KLabel>

    <StringField
      :error="urlHandler.error"
      :error-message="urlHandler.errorMessage"
      name="url"
      @blur="urlHandler.validate"
      @update:model-value="urlHandler.update"
    />

    <HttpMethodField
      name="method"
      @update="setConfig()"
    />

    <NumberField
      :error="timeoutHandler.error"
      :error-message="timeoutHandler.errorMessage"
      name="timeout"
      @blur="timeoutHandler.validate"
      @update:model-value="timeoutHandler.update"
    />

    <StringField
      name="ssl_server_name"
      @update:model-value="setConfig('ssl_server_name')"
    />

    <BooleanField
      name="ssl_verify"
      @update:model-value="setConfig('ssl_verify')"
    />

    <template v-if="hasErrorHandling">
      <NodeFormDivider />

      <KLabel class="dk-node-configuration-label">
        {{ t('plugins.free-form.datakit.flow_editor.node_properties.error_handling.label') }}
      </KLabel>

      <BooleanField
        name="continue_on_error"
        @update:model-value="setConfig('continue_on_error')"
      />

      <KAlert
        v-if="!formData.continue_on_error && isErrorOutputConnected"
        appearance="warning"
        data-testid="dk-call-error-output-hint"
        :message="t('plugins.free-form.datakit.flow_editor.node_properties.error_handling.error_output_hint')"
      />

      <KAlert
        v-if="formData.continue_on_error"
        class="dk-call-failure-hint"
        data-testid="dk-call-failure-hint"
      >
        <p>{{ t('plugins.free-form.datakit.flow_editor.node_properties.error_handling.failure_hint') }}</p>
        <p>{{ t('plugins.free-form.datakit.flow_editor.node_properties.error_handling.failure_example') }}</p>
        <div class="dk-call-failure-example">
          <KCopy :text="FAILURE_CHECK_JQ" />
        </div>
      </KAlert>

      <KCheckbox
        data-testid="dk-call-retry-toggle"
        :label="t('plugins.free-form.datakit.flow_editor.node_properties.error_handling.retry')"
        :model-value="retryEnabled"
        @update:model-value="setRetryEnabled"
      />

      <template v-if="retryEnabled">
        <NumberField
          :error="retryCountHandler.error"
          :error-message="retryCountHandler.errorMessage"
          :label="t('plugins.free-form.datakit.flow_editor.node_properties.error_handling.retry_count')"
          name="retry.count"
          @blur="retryCountHandler.validate"
          @update:model-value="retryCountHandler.update"
        />

        <div class="dk-call-retry-interval">
          <NumberField
            :error="retryIntervalHandler.error"
            :error-message="retryIntervalHandler.errorMessage"
            :label="t('plugins.free-form.datakit.flow_editor.node_properties.error_handling.retry_interval')"
            name="retry.interval"
            @blur="retryIntervalHandler.validate"
            @update:model-value="retryIntervalHandler.update"
          />
          <span class="dk-call-retry-interval-unit">
            {{ t('plugins.free-form.datakit.flow_editor.node_properties.error_handling.seconds') }}
          </span>
        </div>

        <StringArrayField
          :error="retryStatusCodesHandler.error"
          :error-message="retryStatusCodesHandler.errorMessage"
          :help="t('plugins.free-form.datakit.flow_editor.node_properties.error_handling.status_codes_help')"
          :label="t('plugins.free-form.datakit.flow_editor.node_properties.error_handling.retry_status_codes')"
          name="retry.status_codes"
          placeholder="429, 5xx"
          @blur="retryStatusCodesHandler.validate"
          @update:model-value="retryStatusCodesHandler.update"
        />

        <KAlert
          v-if="!isIdempotentMethod"
          appearance="warning"
          data-testid="dk-call-retry-warning"
          :message="t('plugins.free-form.datakit.flow_editor.node_properties.error_handling.retry_warning')"
        />
      </template>
    </template>

    <NodeFormDivider />

    <InputsField
      :field-name-validator="fieldNameValidator"
      :field-names="inputsFieldNames"
      :items="inputOptions"
      node-type="call"
      @change:input="setInput"
      @change:inputs="setInputs"
    />
  </Form>
</template>

<script setup lang="ts">
import { Form, NumberField, BooleanField, StringField, StringArrayField } from '@kong-ui-public/freeform'
import HttpMethodField from './HttpMethodField.vue'
import InputsField from './InputsField.vue'
import NodeFormDivider from './NodeFormDivider.vue'
import useI18n from '../../../../../../composables/useI18n'
import { useNodeForm, useSubSchema, type BaseFormData } from '../composables/useNodeForm'
import { useEditorStore } from '../store/store'
import { computed, useTemplateRef, watch } from 'vue'
import NameField from './NameField.vue'
import type { NodeId } from '../../types'
import type { CallNode } from '../../schema/strict'
import { useFormValidation } from '../composables/validation'
import { notEmpty, compose, stringFormat, numberRange, numberFormat } from '../composables/validation'

const { nodeId } = defineProps<{
  nodeId: NodeId
}>()

const { i18n: { t } } = useI18n()

/** Treats non-2xx responses or call errors as failures, see the ERD of the call node error handling. */
const FAILURE_CHECK_JQ = '.error != null or (.status // 0) < 200 or (.status // 0) > 299'

/** Methods that are safe to repeat when retrying a call. */
const IDEMPOTENT_METHODS = ['GET', 'HEAD', 'PUT', 'DELETE', 'OPTIONS']

/** An exact status code (e.g. `404`) or a status class (e.g. `5xx`), the same as the Gateway schema. */
const STATUS_CODE_PATTERN = /^[1-5](\d{2}|xx)$/

const formRef = useTemplateRef('form')

const schema = useSubSchema('call')

/** Control planes before Gateway 3.17 have no error handling fields in the call node schema. */
const hasErrorHandling = computed(() => {
  const callSchema = schema.value
  return 'fields' in callSchema && callSchema.fields.some((field) => 'continue_on_error' in field)
})

interface CallFormData extends BaseFormData {
  url: string
  method?: string
  timeout?: number
  ssl_server_name?: string
  ssl_verify?: boolean
  continue_on_error?: boolean
  retry?: CallNode['retry']
}

const {
  formData,
  setName,
  setConfig,
  inputOptions,
  setInputs,
  setInput,
  inputsFieldNames,
  nameValidator,
  toggleNodeValid,
  fieldNameValidator,
  currentNode,
} = useNodeForm<CallFormData>(nodeId, () => formRef.value!.getValue())

const { getOutEdgesByNodeId } = useEditorStore()

/** The `error` output is always `nil` unless `continue_on_error` is on, so connecting it alone does nothing. */
const isErrorOutputConnected = computed(() => {
  const errorField = currentNode.value.fields.output.find(({ name }) => name === 'error')
  return !!errorField && getOutEdgesByNodeId(nodeId).some(({ sourceField }) => sourceField === errorField.id)
})

const retryEnabled = computed(() => formData.value.retry != null)

const isIdempotentMethod = computed(() => IDEMPOTENT_METHODS.includes(formData.value.method ?? 'GET'))

function setRetryEnabled(enabled: boolean) {
  const value = { ...formRef.value!.getValue() }
  if (enabled) {
    value.retry = { count: 0, interval: 0 }
  } else {
    delete value.retry
  }
  formRef.value!.setValue(value)
  setConfig()
}

function statusCodes(fieldName: string) {
  return (value?: string[] | null): string | undefined => {
    if (!value?.length) return undefined
    return value.every((code) => STATUS_CODE_PATTERN.test(code))
      ? undefined
      : t('plugins.free-form.datakit.flow_editor.node_properties.errors.invalid_status_codes', { fieldName })
  }
}

const {
  createFieldHandler,
} = useFormValidation({
  validationConfig: {
    url: compose(
      notEmpty({ fieldName: 'URL' }),
      stringFormat('url', { fieldName: 'URL' }),
    ),
    timeout: compose(
      numberFormat('integer'),
      numberRange(0, 2147483646),
    ),
    retry_count: compose(
      numberFormat('integer', { fieldName: 'Number of retries' }),
      numberRange(0, 10, { fieldName: 'Number of retries' }),
    ),
    retry_interval: numberRange(0, 30, { fieldName: 'Retry interval' }),
    retry_status_codes: statusCodes('Retry status codes'),
  },
  getValidationData: () => ({
    url: formData.value.url,
    timeout: formData.value.timeout,
    retry_count: formData.value.retry?.count,
    retry_interval: formData.value.retry?.interval,
    retry_status_codes: formData.value.retry?.status_codes,
  }),
  toggleNodeValid,
})

// Create field handlers
const urlHandler = createFieldHandler('url', () => setConfig('url'))
const timeoutHandler = createFieldHandler('timeout', () => setConfig('timeout'))
const retryCountHandler = createFieldHandler('retry_count', () => setConfig('retry.count'))
const retryIntervalHandler = createFieldHandler('retry_interval', () => setConfig('retry.interval'))
const retryStatusCodesHandler = createFieldHandler('retry_status_codes', () => setConfig('retry.status_codes'))

// The retry fields unmount without a change event, so clear their errors when `retry` goes away
watch(retryEnabled, (enabled) => {
  if (enabled) return
  retryCountHandler.value.validate()
  retryIntervalHandler.value.validate()
  retryStatusCodesHandler.value.validate()
})
</script>

<style lang="scss" scoped>
.dk-call-failure-hint {
  p {
    margin: 0;
  }
}

.dk-call-failure-example {
  background-color: var(--kui-color-background, $kui-color-background);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  margin-top: var(--kui-space-40, $kui-space-40);
  padding: var(--kui-space-40, $kui-space-40);

  :deep(.copy-text) {
    overflow-wrap: anywhere;
    white-space: normal;
  }
}

.dk-call-retry-interval {
  align-items: flex-end;
  display: flex;
  gap: var(--kui-space-50, $kui-space-50);

  .ff-number-field-wrapper {
    flex: 1;
  }

  &-unit {
    color: var(--kui-color-text, $kui-color-text);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    line-height: 40px;
  }
}
</style>
