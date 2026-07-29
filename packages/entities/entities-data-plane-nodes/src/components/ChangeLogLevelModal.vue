<template>
  <KModal
    :action-button-disabled="isSaving || !expirationValid || props.nodes.length === 0"
    :action-button-text="i18n.t('modal.save')"
    :cancel-button-disabled="isSaving"
    :cancel-button-text="i18n.t('modal.cancel')"
    data-testid="change-log-level-modal"
    :hide-close-icon="isSaving"
    max-width="640px"
    :title="i18n.t('modal.title')"
    :visible="visible"
    @cancel="onCancel"
    @proceed="save"
  >
    <div class="change-log-level-modal-content">
      <p class="description">
        {{ i18n.t('modal.description') }}
      </p>

      <KAlert
        appearance="warning"
        data-testid="log-level-warning"
        :message="i18n.t('modal.warning')"
        show-icon
      />

      <KSelect
        v-model="targetLogLevel"
        data-testid="log-level-select"
        :items="logLevelItems"
        :kpop-attributes="{ 'data-testid': 'log-level-select-popover' }"
        :label="i18n.t('modal.log_level_label')"
      />

      <KInput
        v-model.number="expiration"
        data-testid="expiration-input"
        :error="!expirationValid"
        :help="i18n.t('modal.expiration.help')"
        :label="i18n.t('modal.expiration.label')"
        :label-attributes="{
          info: i18n.t('modal.expiration.tooltip'),
          tooltipAttributes: { maxWidth: '340px' },
        }"
        max="3600"
        min="1"
        type="number"
      />

      <KAlert
        v-if="errorMessage"
        appearance="danger"
        data-testid="log-level-error"
        :message="errorMessage"
      />
    </div>
  </KModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useAxios, useErrors } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import endpoints from '../data-plane-nodes-endpoints'
import { LogLevel, LOG_LEVELS } from '../types'
import type { ChangeLogLevelConfig, LogLevelOperationPayload } from '../types'

defineOptions({
  name: 'ChangeLogLevelModal',
})

const props = defineProps<{
  config: ChangeLogLevelConfig
  nodes: Array<{ id: string, hostname: string }>
}>()

const emit = defineEmits<{
  success: []
}>()

const visible = defineModel<boolean>('visible')

const { i18n } = composables.useI18n()
const { axiosInstance } = useAxios(props.config.axiosRequestConfig)
const { getMessageFromError } = useErrors()

const DEFAULT_LOG_LEVEL = LogLevel.Notice
const DEFAULT_EXPIRATION = 600 // seconds (10 minutes)

const targetLogLevel = ref<LogLevel>(DEFAULT_LOG_LEVEL)
const expiration = ref<number>(DEFAULT_EXPIRATION)
const isSaving = ref<boolean>(false)
const errorMessage = ref<string>('')

const logLevelItems = computed(() => LOG_LEVELS.map((level) => ({
  label: i18n.t(`log_level.${level}`),
  value: level,
})))

const expirationValid = computed(() =>
  Number.isInteger(expiration.value) && expiration.value >= 1 && expiration.value <= 3600)

const buildUrl = (template: string): string => {
  let url = `${props.config.apiBaseUrl}${template}`
  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId)
  }
  return url
}

const save = async () => {
  errorMessage.value = ''
  isSaving.value = true

  try {
    const url = buildUrl(endpoints.logLevel[props.config.app].update)
    const payload: LogLevelOperationPayload = {
      log_level: targetLogLevel.value,
      ttl: expiration.value,
      targets: { node_ids: props.nodes.map((node) => node.id) },
    }
    await axiosInstance.post(url, payload)
    emit('success')
  } catch (error: any) {
    errorMessage.value = getMessageFromError(error)
  } finally {
    isSaving.value = false
  }
}

const onCancel = () => {
  visible.value = false
  targetLogLevel.value = DEFAULT_LOG_LEVEL
  expiration.value = DEFAULT_EXPIRATION
  errorMessage.value = ''
}
</script>

<style lang="scss" scoped>
.change-log-level-modal-content {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-70, $kui-space-70);

  .description {
    color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
    margin: 0;
  }
}
</style>
