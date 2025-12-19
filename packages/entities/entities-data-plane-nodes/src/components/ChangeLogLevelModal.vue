<template>
  <KModal
    :action-button-disabled="actionButtonDisabled"
    :action-button-text="actionButtonText"
    data-testid="change-log-level-modal"
    :hide-cancel-button="true"
    :hide-close-icon="modalEditStage === 'submitting'"
    max-width="640px"
    :title="title"
    :visible="visible"
    @cancel="closeAndReset"
    @proceed="onProceed"
  >
    <KSelect
      v-if="modalEditStage === 'edit'"
      v-model="targetLogLevel"
      class="log-level-select"
      data-testid="log-level-select"
      :items="logLevelCandidates"
      :label="i18n.t('modal.select_log_level_title')"
    />

    <div class="explanation-wrapper">
      <KLabel>{{ i18n.t(`log_level.${targetLogLevel}`) }}</KLabel>
      <div>{{ explanation.explanation }}</div>
      <div
        v-if="explanation.warning"
        class="warning-message"
        data-testid="log-level-warning-message"
      >
        {{ explanation.warning }}
      </div>
    </div>

    <div class="revert-after-wrapper">
      <KLabel>{{ i18n.t('modal.revert_to_default_after.label') }}</KLabel>
      <div class="time">
        <KInput
          v-model="revertAfterString"
          class="time-input"
          data-testid="log-level-timeout"
          :disabled="modalEditStage !== 'edit'"
          :error="revertAfter <= 0 || isNaN(revertAfter)"
          min="1"
          type="number"
        />
        <span class="seconds">{{ i18n.t('modal.revert_to_default_after.seconds') }}</span>
        <span
          class="formatted-time"
          data-testid="log-level-timeout-formatted"
        >{{ friendlyTime }}</span>
      </div>
    </div>

    <table
      class="data-plane-node-list"
      data-testid="data-plane-node-list"
    >
      <thead>
        <th style="width: 40%">
          {{ i18n.t('modal.dp_list.header.host') }}
        </th>
        <th style="width: 40%">
          {{ i18n.t('modal.dp_list.header.action') }}
        </th>
        <th>{{ i18n.t('modal.dp_list.header.status') }}</th>
      </thead>

      <tbody>
        <CLLModalNodeRow
          v-for="node in props.instanceList"
          :key="node.id"
          :ref="el => setHostListNodeItemRefs(node.id, el as any)"
          :check-log-level="checkDataPlaneLogLevel"
          :data-plane-id="node.id"
          :data-testid="`data-plane-node-list-row-${node.id}`"
          :has-dll-capability="node.hasDLLCapability ?? true"
          :hostname="node.hostname"
          :log-level-hint="props.instanceLogLevel?.get(node.id)"
          :target-log-level="targetLogLevel"
        />
      </tbody>
    </table>
  </KModal>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import composables from '../composables'
import CLLModalNodeRow from './CLLModalNodeRow.vue'
import { LogLevel, type DataPlaneNodeCommon } from '../types'
import type { AsyncScheduler, AsyncSchedulerOptions } from '../composables'

defineOptions({
  name: 'ChangeLogLevelModal',
})

const props = defineProps<{
  instanceList: Array<Pick<DataPlaneNodeCommon, 'id' | 'hostname'> & { hasDLLCapability?: boolean }>
  instanceLogLevel: Map<string /* instanceId */, LogLevel>
  requests: {
    scheduler?: AsyncScheduler | AsyncSchedulerOptions | null // default to { maxConcurrentAsyncs: 10 }
    getDataPlaneLogLevel: (instanceId: string) => Promise<LogLevel>
    setDataPlaneLogLevel: (instanceId: string, logLevel: LogLevel, revertAfter: number) => Promise<void>
  }
}>()

const visible = defineModel<boolean>('visible')

const initialLogLevel = LogLevel.Notice

const { i18n } = composables.useI18n()

const modalEditStage = ref<'edit' | 'submitting' | 'submitted'>('edit')

const targetLogLevel = ref<LogLevel>(initialLogLevel)
const revertAfterString = ref<string>('60')
const revertAfter = computed(() => Math.floor(Number(revertAfterString.value)))
const capableInstanceList = computed(() => props.instanceList.filter(node => node.hasDLLCapability !== false))

const title = computed(() => {
  const summary = capableInstanceList.value.length === 1
    ? i18n.t('modal.change_log_level.summary_with_name', { name: capableInstanceList.value[0]?.hostname })
    : i18n.t('modal.change_log_level.summary_with_number', { number: `${capableInstanceList.value.length}` })
  return i18n.t('modal.change_log_level.title', { summary })
})

const actionButtonDisabled = computed(() => {
  return modalEditStage.value === 'submitting' ||
    isNaN(revertAfter.value) || revertAfter.value <= 0 ||
    capableInstanceList.value.length === 0
})

const logLevelCandidates = composables.useLogLevelCandidateSelectItems({
  initialSelected: initialLogLevel,
})

const explanation = composables.useLogLevelExplanation(targetLogLevel)
const friendlyTime = composables.useFriendlyRevertTime(revertAfter)

const asyncScheduler = composables.useAsyncScheduler(
  props.requests.scheduler === undefined
    ? { maxConcurrentAsyncs: 10 }
    : props.requests.scheduler,
)

const { checkDataPlaneLogLevel } = composables.useDataPlaneLogLevelChecker({
  getDataPlaneLogLevel: props.requests.getDataPlaneLogLevel,
  setDataPlaneLogLevel: props.requests.setDataPlaneLogLevel,
  requestExecutor: asyncScheduler.schedule,
})

// workaround for https://github.com/vuejs/core/issues/9617
// use ref directly when the issue get fixed
const hostNodeCompRefs = new Map<string, InstanceType<typeof CLLModalNodeRow>>()
const setHostListNodeItemRefs = (dataPlaneId: string, ref: InstanceType<typeof CLLModalNodeRow> | null) => {
  if (ref === null) {
    hostNodeCompRefs.delete(dataPlaneId)
  } else {
    hostNodeCompRefs.set(dataPlaneId, ref)
  }
}

const onProceed = async () => {
  if (modalEditStage.value !== 'edit') {
    closeAndReset()
    return
  }

  modalEditStage.value = 'submitting'

  const promises = Array.from(hostNodeCompRefs.values()).map(comp => {
    return comp.updateLogLevel(targetLogLevel.value, revertAfter.value)
  })

  try {
    await Promise.all(promises)
  } catch (error) {
    console.error('Failed to update log level', error)
  } finally {
    modalEditStage.value = 'submitted'
  }
}

const closeAndReset = () => {
  visible.value = false
  revertAfterString.value = '60'
  modalEditStage.value = 'edit'
  targetLogLevel.value = initialLogLevel
}

const actionButtonText = computed(() => {
  switch (modalEditStage.value) {
    case 'submitting':
      return i18n.t('modal.action_button.submitting')
    case 'submitted':
      return i18n.t('modal.action_button.ok')
    default:
      return i18n.t('modal.action_button.confirm')
  }
})
</script>

<style lang="scss" scoped>
.log-level-select,
.explanation-wrapper {
  margin-bottom: $kui-space-70;
}

.explanation-wrapper {
  :deep(.k-label) {
    margin-bottom: 0 !important;
  }

  .warning-message {
    color: $kui-color-text-danger;
  }
}

.revert-after-wrapper {
  margin-bottom: $kui-space-40;

  .time {
    align-items: center;
    display: flex;

    .time-input {
      margin-right: $kui-space-40;
      width: 80px;
    }

    .seconds {
      color: $kui-color-text;
    }

    .formatted-time {
      color: $kui-color-text-neutral-strong;
      font-style: italic;
      margin-left: $kui-space-130;
    }
  }
}

.data-plane-node-list {
  th, td {
    color: $kui-color-text;
  }

  thead {
    text-align: left;

    th {
      font-weight: $kui-font-weight-bold;
      line-height: $kui-line-height-70;
    }
  }
}
</style>
