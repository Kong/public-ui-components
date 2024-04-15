import { computed, toValue } from 'vue'
import useI18n from './useI18n'

import type { ComputedRef, MaybeRef } from 'vue'
import type { SelectItem } from '@kong/kongponents'
import { LogLevel } from '../types'

export const supportedLevels: LogLevel[] = [
  LogLevel.Debug,
  LogLevel.Info,
  LogLevel.Notice,
  LogLevel.Warn,
  LogLevel.Error,
  LogLevel.Critical,
]

export const useLogLevelSelectItems = (opt?: MaybeRef<{
  initialSelected?: LogLevel,
  disabled?: LogLevel[],
}>): ComputedRef<SelectItem[]> => {
  const { i18n } = useI18n()

  return computed(() => {
    const optValue = toValue(opt)
    const initialSelected = optValue?.initialSelected ?? null
    const disabled = optValue?.disabled ?? []

    return supportedLevels.map((level) => ({
      label: i18n.t(`log_level.${level}`),
      value: level,
      selected: initialSelected === level,
      disabled: disabled.includes(level),
    } satisfies SelectItem))
  })
}

export type LogLevelExplanation = { explanation: string, warning?: string }
export const useLogLevelExplanation = (level: MaybeRef<LogLevel>): ComputedRef<LogLevelExplanation> => {
  const warningLevels = [LogLevel.Debug, LogLevel.Info, LogLevel.Notice, LogLevel.Warn]
  return computed(() => {
    const { i18n } = useI18n()
    const levelValue = toValue(level)
    const explanation = i18n.t(`modal.log_level_explanation.${levelValue}`)

    return {
      explanation,
      warning: warningLevels.includes(levelValue) ? i18n.t('modal.log_level_disk_space_warning') : undefined,
    }
  })
}
