<template>
  <KModal
    :action-button-disabled="stage === 'edit' && (isSaving || !expirationValid || props.nodes.length === 0)"
    :action-button-text="actionButtonText"
    :cancel-button-disabled="isSaving"
    :cancel-button-text="i18n.t('modal.cancel')"
    data-testid="change-log-level-modal"
    :hide-cancel-button="stage === 'status'"
    :hide-close-icon="isSaving"
    max-width="640px"
    :title="title"
    :visible="visible"
    @cancel="onCancel"
    @proceed="onProceed"
  >
    <div
      v-if="stage === 'edit'"
      class="change-log-level-modal-content"
    >
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

    <div
      v-else
      class="change-log-level-status"
    >
      <KTableView
        class="change-log-level-status-table"
        :data="rows"
        data-testid="log-level-status-table"
        :headers="statusHeaders"
        hide-pagination
        row-key="id"
      >
        <template #host="{ row }">
          <KExternalLink
            v-if="getNodeDetailRoute"
            hide-icon
            :href="getNodeDetailRoute(row.id)"
          >
            {{ row.hostname }}
          </KExternalLink>
          <template v-else>
            {{ row.hostname }}
          </template>
        </template>
        <template #status="{ row }">
          <KBadge
            :appearance="STATUS_APPEARANCE[row.status]"
            :data-testid="`log-level-status-${row.status}`"
          >
            <template #icon>
              <component :is="STATUS_ICON[row.status]" />
            </template>
            {{ i18n.t(`operation_status.${row.status}`) }}
          </KBadge>
        </template>
      </KTableView>

      <p class="status-note">
        <InfoIcon :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`" />
        <span>{{ i18n.t('modal.status_note') }}</span>
      </p>
    </div>
  </KModal>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useAxios, useErrors } from '@kong-ui-public/entities-shared'
import { CheckCircleIcon, DangerCircleIcon, InfoIcon, ProgressIcon, WarningIcon } from '@kong/icons'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import composables from '../composables'
import endpoints from '../data-plane-nodes-endpoints'
import { LogLevel, LOG_LEVELS } from '../types'
import type {
  ChangeLogLevelConfig,
  LogLevelOperationPayload,
  LogLevelOperationResponse,
  LogLevelOperationResultsResponse,
  LogLevelOperationStatus,
} from '../types'
import type { Component } from 'vue'
import type { BadgeAppearance } from '@kong/kongponents'

defineOptions({
  name: 'ChangeLogLevelModal',
})

const props = defineProps<{
  config: ChangeLogLevelConfig
  nodes: Array<{ id: string, hostname: string }>
  getNodeDetailRoute?: (nodeId: string) => string
}>()

const emit = defineEmits<{
  success: []
  close: []
  'node-error': [payload: { id: string, hostname: string, status: 'failed' | 'unsupported' }]
}>()

const visible = defineModel<boolean>('visible')

const { i18n } = composables.useI18n()
const { axiosInstance } = useAxios(props.config.axiosRequestConfig)
const { getMessageFromError } = useErrors()

const DEFAULT_LOG_LEVEL = LogLevel.Notice
const DEFAULT_EXPIRATION = 600 // seconds (10 minutes)
const POLL_INTERVAL_MS = 2000

const STATUS_APPEARANCE: Record<LogLevelOperationStatus, BadgeAppearance> = {
  in_progress: 'info',
  applied: 'success',
  reverted: 'neutral',
  superseded: 'neutral',
  failed: 'danger',
  unsupported: 'warning',
}

const STATUS_ICON: Record<LogLevelOperationStatus, Component> = {
  in_progress: ProgressIcon,
  applied: CheckCircleIcon,
  reverted: InfoIcon,
  superseded: InfoIcon,
  failed: DangerCircleIcon,
  unsupported: WarningIcon,
}

const stage = ref<'edit' | 'status'>('edit')
const targetLogLevel = ref<LogLevel>(DEFAULT_LOG_LEVEL)
const expiration = ref<number>(DEFAULT_EXPIRATION)
const isSaving = ref<boolean>(false)
const errorMessage = ref<string>('')
const operationId = ref<string>('')
const statusByNodeId = ref<Record<string, LogLevelOperationStatus>>({})
const pollTimeoutId = ref<ReturnType<typeof setTimeout> | null>(null)
// Whether a polling run is active. Guards against an in-flight request rescheduling after the run
// was stopped (e.g. the modal was reopened) while its request was still awaiting a response.
const isPolling = ref<boolean>(false)
// Node ids that have already emitted `node-error`, so we only emit once per node per operation.
const erroredNodeIds = new Set<string>()

const logLevelItems = computed(() => LOG_LEVELS.map((level) => ({
  label: i18n.t(`log_level.${level}`),
  value: level,
})))

const expirationValid = computed(() =>
  Number.isInteger(expiration.value) && expiration.value >= 1 && expiration.value <= 3600)

const title = computed(() =>
  stage.value === 'status' ? i18n.t('modal.status_title') : i18n.t('modal.title'))

const actionButtonText = computed(() =>
  stage.value === 'status' ? i18n.t('modal.done') : i18n.t('modal.save'))

const statusHeaders = computed(() => [
  { key: 'host', label: i18n.t('modal.node_host') },
  { key: 'status', label: i18n.t('modal.status') },
])

const rows = computed(() => props.nodes.map((node) => ({
  id: node.id,
  hostname: node.hostname,
  status: statusByNodeId.value[node.id] ?? 'in_progress' as LogLevelOperationStatus,
})))

const buildUrl = (template: string, id?: string): string => {
  let url = `${props.config.apiBaseUrl}${template}`
  if (props.config.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config.controlPlaneId)
  }
  return url.replace(/{operationId}/gi, id ?? '')
}

const clearPolling = () => {
  isPolling.value = false
  if (pollTimeoutId.value) {
    clearTimeout(pollTimeoutId.value)
    pollTimeoutId.value = null
  }
}

const pollResults = async () => {
  try {
    const url = buildUrl(endpoints.logLevel[props.config.app].results, operationId.value)
    const { data } = await axiosInstance.get<LogLevelOperationResultsResponse>(url)
    for (const result of data.data) {
      statusByNodeId.value[result.node_id] = result.status
      // Emit `node-error` once per node when it fails or is unsupported.
      if ((result.status === 'failed' || result.status === 'unsupported') && !erroredNodeIds.has(result.node_id)) {
        erroredNodeIds.add(result.node_id)
        const hostname = props.nodes.find((node) => node.id === result.node_id)?.hostname ?? ''
        emit('node-error', { id: result.node_id, hostname, status: result.status })
      }
    }
    // Stop once every node has settled (no node is still in progress).
    if (data.data.length > 0 && data.data.every((result) => result.status !== 'in_progress')) {
      clearPolling()
      return
    }
  } catch {
    // Ignore the error and keep polling.
  }
  // The run may have been stopped (e.g. the modal was reopened) while the request was in flight.
  if (!isPolling.value) {
    return
  }
  // Poll again 2 seconds after each response, regardless of success or failure.
  pollTimeoutId.value = setTimeout(() => {
    pollTimeoutId.value = null
    pollResults()
  }, POLL_INTERVAL_MS)
}

const startPolling = () => {
  statusByNodeId.value = {}
  isPolling.value = true
  pollResults()
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
    const { data } = await axiosInstance.post<LogLevelOperationResponse>(url, payload)
    operationId.value = data.id
    emit('success')
    stage.value = 'status'
    startPolling()
  } catch (error: any) {
    errorMessage.value = getMessageFromError(error)
  } finally {
    isSaving.value = false
  }
}

const onProceed = () => {
  if (stage.value === 'status') {
    onCancel()
  } else {
    save()
  }
}

const onCancel = () => {
  // The host is responsible for closing the modal (e.g. via `v-model:visible`) in response to this
  // event. Closing does NOT stop polling on purpose - a still-running operation keeps polling in the
  // background; polling is stopped (and the form reset) the next time the modal is opened.
  emit('close')
}

const reset = () => {
  clearPolling()
  stage.value = 'edit'
  targetLogLevel.value = DEFAULT_LOG_LEVEL
  expiration.value = DEFAULT_EXPIRATION
  errorMessage.value = ''
  operationId.value = ''
  statusByNodeId.value = {}
  erroredNodeIds.clear()
}

// Reset (and stop any leftover polling from a previous run) whenever the modal is opened.
watch(visible, (isVisible) => {
  if (isVisible) {
    reset()
  }
})

onBeforeUnmount(clearPolling)
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

.change-log-level-status {
  .change-log-level-status-table {
    background-color: var(--kui-color-background-transparent, $kui-color-background-transparent);
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  }

  .status-note {
    color: var(--kui-color-text-neutral-stronger, $kui-color-text-neutral-stronger);
    display: flex;
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    gap: var(--kui-space-40, $kui-space-40);
    margin: var(--kui-space-60, $kui-space-60) 0 0 !important;

    :deep(svg) {
      flex-shrink: 0;
      margin-top: var(--kui-space-10, $kui-space-10);
    }
  }
}
</style>
