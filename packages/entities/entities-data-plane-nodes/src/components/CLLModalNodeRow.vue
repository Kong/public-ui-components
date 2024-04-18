<template>
  <tr>
    <td>{{ hostname }}</td>
    <td>
      <KSkeleton
        v-if="!currentLogLevel"
        type="spinner"
      />
      <template v-else>
        <span>{{ i18n.t(`log_level.${currentLogLevel!}`) }}</span>
        <span v-if="currentLogLevel !== targetLogLevel">
          → {{ i18n.t(`log_level.${targetLogLevel}`) }}
        </span>
      </template>
    </td>
    <td>
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
import { computed } from 'vue'
import composables from '../composables'
import { CheckCircleIcon, ClearIcon, EqualIcon, ProgressIcon } from '@kong/icons'

import type { LogLevel } from '../types'

const props = defineProps<{
  dataPlaneId: string
  hostname: string
  targetLogLevel: LogLevel
  checkLogLevel: ReturnType<typeof composables.useDataPlaneLogLevelChecker>['checkDataPlaneLogLevel']
  logLevelHint?: LogLevel | null
}>()

const { i18n } = composables.useI18n()

const {
  currentLogLevel,
  updateStatus,
  updateErrorMessage,
  updateLogLevel,
} = props.checkLogLevel(props.dataPlaneId, {
  currentLogLevelHint: () => props.logLevelHint ?? null,
})

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
      return 'warning'
    default: /* 'pending' */
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
    default: /* 'loading' */
      return i18n.t('modal.dp_list.status.loading')
  }
})

const statusIcon = computed(() => {
  switch (updateStatus.value) {
    case 'success':
      return CheckCircleIcon
    case 'error':
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
  color: $kui-color-text;
}

tbody {
  tr {
    font-weight: $kui-font-weight-semibold;
    line-height: $kui-line-height-80;
  }
}

.badge-cell {
  vertical-align: sub;
}
</style>
