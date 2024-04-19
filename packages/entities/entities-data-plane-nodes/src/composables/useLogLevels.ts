import { computed, ref, toValue, watch } from 'vue'
import { useErrors } from '@kong-ui-public/entities-shared'
import { LogLevel } from '../types'
import useI18n from './useI18n'
import { AsyncAbortException } from './useAsyncScheduler'

import type { ComputedRef, MaybeRefOrGetter, Ref } from 'vue'
import type { SelectItem } from '@kong/kongponents'

export const supportedLevels: LogLevel[] = [
  LogLevel.Debug,
  LogLevel.Info,
  LogLevel.Notice,
  LogLevel.Warn,
  LogLevel.Error,
  LogLevel.Critical,
]

export const useLogLevelCandidateSelectItems = (opt?: {
  initialSelected?: LogLevel,
  disabled?: MaybeRefOrGetter<LogLevel[]>,
}): ComputedRef<SelectItem[]> => {
  const { i18n } = useI18n()

  return computed(() => {
    const disabled = toValue(opt?.disabled) ?? []

    return supportedLevels.map((level) => ({
      label: i18n.t(`log_level.${level}`),
      value: level,
      selected: opt?.initialSelected === level,
      disabled: disabled.includes(level),
    } satisfies SelectItem))
  })
}

export type LogLevelExplanation = { explanation: string, warning?: string }
export const useLogLevelExplanation = (level: MaybeRefOrGetter<LogLevel>): ComputedRef<LogLevelExplanation> => {
  const warningLevels = [LogLevel.Debug]
  const { i18n } = useI18n()

  return computed(() => {
    const levelValue = toValue(level)
    const explanation = i18n.t(`modal.log_level_explanation.${levelValue}`)

    return {
      explanation,
      warning: warningLevels.includes(levelValue) ? i18n.t('modal.log_level_disk_space_warning') : undefined,
    }
  })
}

export const useFriendlyRevertTime = (revertTime: MaybeRefOrGetter<number>): ComputedRef<string> => {
  const { i18n } = useI18n()

  return computed(() => {
    const time = toValue(revertTime)

    let timeString = ''
    const secs = time % 60
    if (secs !== 0) {
      timeString += `${secs} ${i18n.t('modal.revert_to_default_after.seconds')}`
    }
    const mins = Math.floor(time / 60) % 60
    if (mins !== 0) {
      timeString = `${mins} ${i18n.t('modal.revert_to_default_after.minutes')} ${timeString}`
    }
    const hours = Math.floor(time / 3600)
    if (hours !== 0) {
      timeString = `${hours} ${i18n.t('modal.revert_to_default_after.hours')} ${timeString}`
    }
    return timeString
  })
}

export type DataPlaneLogLevel = {
  currentLogLevel: Ref<LogLevel | null>,
  updateStatus: Ref<'pending' | 'success' | 'error' | 'loading'>,
  updateErrorMessage: Ref<string | null>,
  updateLogLevel: (level: LogLevel, revertAfter: number) => Promise<void>,
}

export const useDataPlaneLogLevelChecker = (opt: {
  getDataPlaneLogLevel: (dataPlaneId: string) => Promise<LogLevel>,
  setDataPlaneLogLevel: (dataPlaneId: string, level: LogLevel, revertAfter: number) => Promise<void>,
  requestExecutor?: <T>(fn: () => Promise<T>) => Promise<T>,
}) => {
  const requestExecutor = opt.requestExecutor ?? (fn => fn())
  const { getDataPlaneLogLevel, setDataPlaneLogLevel } = opt

  const { getMessageFromError } = useErrors()

  const checkDataPlaneLogLevel = (dataPlaneId: string, opt?: {
    currentLogLevelHint?: MaybeRefOrGetter<LogLevel | null>,
  }): DataPlaneLogLevel => {
    const currentLogLevel = ref<LogLevel | null>(toValue(opt?.currentLogLevelHint) ?? null)

    if (currentLogLevel.value === null) {
      requestExecutor(async () => {
        currentLogLevel.value = await getDataPlaneLogLevel(dataPlaneId)
      }).catch((err) => {
        if (err instanceof AsyncAbortException) return
        console.error('Failed to get data plane log level', err)
      })
    }

    if (opt?.currentLogLevelHint) {
      watch(() => toValue(opt.currentLogLevelHint), (hint) => {
        if (hint) {
          currentLogLevel.value = hint
        }
      })
    }

    const updateStatus = ref<'pending' | 'success' | 'error' | 'loading'>('pending')
    const updateErrorMessage = ref<string | null>(null)
    const updateLogLevel = async (level: LogLevel, revertAfter: number) => {
      updateStatus.value = 'loading'
      updateErrorMessage.value = null

      try {
        await requestExecutor(() => setDataPlaneLogLevel(dataPlaneId, level, revertAfter))
        currentLogLevel.value = level
        updateStatus.value = 'success'
      } catch (err) {
        updateErrorMessage.value = getMessageFromError(err)
        updateStatus.value = 'error'
      }
    }

    return {
      currentLogLevel,
      updateStatus,
      updateErrorMessage,
      updateLogLevel,
    }
  }

  return { checkDataPlaneLogLevel }
}
