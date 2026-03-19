<template>
  <tr>
    <td>{{ hostname }}</td>
    <td data-testid="log-change-action">
      <span v-if="currentLogLevel === 'not_supported'">
        {{ i18n.t('log_level.not_applicable') }}
      </span>
      <KSkeleton
        v-else-if="!currentLogLevel"
        type="spinner"
      />
      <template v-else>
        <span data-testid="log-change-action-current-level">{{ i18n.t(`log_level.${currentLogLevel!}`) }}</span>
        <span v-if="currentLogLevel !== targetLogLevel">
          →
          <span data-testid="log-change-action-target-level">{{ i18n.t(`log_level.${targetLogLevel}`) }}</span>
        </span>
      </template>
    </td>
    <td data-testid="log-change-status">
      <KTooltip
        v-if="updateErrorMessage"
        :text="updateErrorMessage"
      >
        <KBadge
          :appearance="statusAppearance"
          class="badge-cell"
        >
          <template #icon>
            <component :is="statusIcon" />
          </template>
          {{ statusText }}
        </KBadge>
      </KTooltip>

      <KBadge
        v-else
        :appearance="statusAppearance"
        class="badge-cell"
      >
        <template #icon>
          <component :is="statusIcon" />
        </template>
        {{ statusText }}
      </KBadge>
    </td>
  </tr>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import composables from '../composables'
import { CheckCircleIcon, ClearIcon, EqualIcon, ProgressIcon } from '@kong/icons'

import type { Ref } from 'vue'
import type { DataPlaneLogLevel } from '../composables'
import type { LogLevel } from '../types'

type NoDLLCapability = 'not_supported'

const props = defineProps<{
  dataPlaneId: string
  hostname: string
  hasDllCapability: boolean
  targetLogLevel: LogLevel
  checkLogLevel: ReturnType<typeof composables.useDataPlaneLogLevelChecker>['checkDataPlaneLogLevel']
  logLevelHint?: LogLevel | null
}>()

const { i18n } = composables.useI18n()

let currentLogLevel = ref<LogLevel | NoDLLCapability | null>('not_supported')
let updateStatus: DataPlaneLogLevel['updateStatus'] | Ref<NoDLLCapability> = ref('not_supported')
let updateErrorMessage = ref<string | null>(null)
let updateLogLevel: DataPlaneLogLevel['updateLogLevel'] = async () => {}

if (props.hasDllCapability) {
  ({
    currentLogLevel,
    updateStatus,
    updateErrorMessage,
    updateLogLevel,
  } = props.checkLogLevel(props.dataPlaneId, {
    currentLogLevelHint: () => props.logLevelHint ?? null,
  }))
}

defineExpose({
  updateLogLevel,
})

const statusAppearance = computed(() => {
  switch (updateStatus.value) {
    case 'success':
      return 'success'
    case 'error':
      return 'danger'
    case 'loading':
    case 'pending':
      return 'warning'
    default: /* 'not_supported' */
      return 'neutral'
  }
})

const statusText = computed(() => {
  switch (updateStatus.value) {
    case 'success':
      return i18n.t('modal.dp_list.status.succeed')
    case 'error':
      return i18n.t('modal.dp_list.status.failed')
    case 'pending':
      return i18n.t('modal.dp_list.status.pending')
    case 'loading':
      return i18n.t('modal.dp_list.status.loading')
    default: /* 'not_supported' */
      return i18n.t('modal.dp_list.status.not_supported')
  }
})

const statusIcon = computed(() => {
  switch (updateStatus.value) {
    case 'success':
      return CheckCircleIcon
    case 'error':
    case 'not_supported':
      return ClearIcon
    case 'loading':
      return ProgressIcon
    default: /* 'pending' */
      return EqualIcon
  }
})
</script>

<style lang="scss" scoped>
tr, td {
  color: var(--kui-color-text, $kui-color-text);
}

tbody {
  tr {
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    line-height: var(--kui-line-height-80, $kui-line-height-80);
  }
}

.badge-cell {
  vertical-align: sub;
}
</style>
