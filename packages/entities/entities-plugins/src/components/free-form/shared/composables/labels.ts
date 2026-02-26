import { computed, inject, provide, ref, toRef, toValue, watch } from 'vue'
import { FIELD_RESET_LABEL_PATH_SETTING } from './constants'
import { upperFirst } from 'lodash-es'
import { useFieldAncestors } from './ancestors'
import { useFormShared } from './form-context'
import * as utils from '../utils'

import type { LabelAttributes } from '@kong/kongponents'
import type { MaybeRefOrGetter } from 'vue'
import type { ResetLabelPathRule } from '../types'

const labelDictionary: Record<string, string> = {
  ip: 'IP',
  ssl: 'SSL',
  ttl: 'TTL',
  url: 'URL',
  http: 'HTTP',
  https: 'HTTPS',
  api: 'API',
  uri: 'URI',
  jq: 'jq',
  vpn: 'VPN',
  id: 'ID',
  llm: 'LLM',
  tls: 'TLS',
  tcp: 'TCP',
  udp: 'UDP',
  lua: 'Lua',
  jwt: 'JWT',
  aws: 'AWS',
  gcp: 'GCP',
  azure: 'Azure',
  acl: 'ACL',
  cookie: 'Cookie',
}

export function replaceByDictionary(name: string) {
  return labelDictionary[name.toLocaleLowerCase()] ?? name
}

/**
 * Replace parts of a field name using a predefined dictionary.
 * @example 'by_lua' => 'by Lua'
 */
export function replaceByDictionaryInFieldName(fieldName: string) {
  return fieldName.split('_')
    .map(replaceByDictionary)
    .join(' ')
}

export function useLabelPath(fieldName: string, rule: MaybeRefOrGetter<ResetLabelPathRule | undefined>) {
  type Setting = {
    parentPath: string | null
    isolate: boolean
  }

  const inheritedSetting = inject<MaybeRefOrGetter<Setting>>(FIELD_RESET_LABEL_PATH_SETTING, {
    parentPath: null,
    isolate: false,
  })

  const { parentPath, isolate } = toValue(inheritedSetting)

  // default inherit from parent
  const finalPath = ref(parentPath ? utils.resolve(parentPath, fieldName) : fieldName)

  const nextSetting = ref<Setting>({
    parentPath: finalPath.value,
    isolate,
  })

  watch([toRef(rule), toRef(inheritedSetting)], ([ruleValue, settingValue]) => {
    const { parentPath, isolate } = settingValue
    const inheritedPath = parentPath ? utils.resolve(parentPath, fieldName) : fieldName

    if (ruleValue) {
      const ruleHandlers: Record<ResetLabelPathRule, () => void> = {
        'isolate': () => {
          finalPath.value = fieldName
          nextSetting.value.isolate = true
          nextSetting.value.parentPath = null
        },
        'isolate-children': () => {
          nextSetting.value.isolate = true
          nextSetting.value.parentPath = null
        },
        'reset': () => {
          finalPath.value = fieldName
          nextSetting.value.isolate = false
          nextSetting.value.parentPath = null
        },
        'reset-children': () => {
          nextSetting.value.isolate = false
          nextSetting.value.parentPath = null
        },
        'inherit': () => {
          finalPath.value = inheritedPath
          nextSetting.value.isolate = false
          nextSetting.value.parentPath = inheritedPath
        },
      }

      ruleHandlers[ruleValue]?.()
    } else if (isolate) {
      finalPath.value = fieldName
      nextSetting.value.isolate = true
      nextSetting.value.parentPath = null
    }
  }, { deep: true, immediate: true })

  provide(FIELD_RESET_LABEL_PATH_SETTING, nextSetting)

  return finalPath
}

export function defaultLabelFormatter(fieldPath: string): string {
  const parts = utils.toArray(fieldPath)
  return parts
    .map(fieldName => fieldName
      .split('_')
      .map(replaceByDictionary)
      .join(' '))
    .map(upperFirst)
    .join(' › ')
}

export function useFieldLabel(
  fieldPath: MaybeRefOrGetter<string>,
  resetLabelPathRule: MaybeRefOrGetter<ResetLabelPathRule | undefined>,
) {
  const pathValue = toValue(fieldPath)
  const fieldName = utils.getName(pathValue)
  const { config, getSchema } = useFormShared()
  const parentLabelPath = useLabelPath(fieldName, resetLabelPathRule)
  const ancestors = useFieldAncestors(fieldPath)

  return computed(() => {
    const realPath = parentLabelPath.value ?? fieldName

    const parentSchema = ancestors.value.parent?.path
      ? getSchema(ancestors.value.parent.path)
      : null

    const parentIsArray = parentSchema?.type === 'array'

    const res = parentIsArray
      ? '' // hide the label when it is a child of Array
      : defaultLabelFormatter(realPath)

    return config.value.transformLabel ? config.value.transformLabel(res, pathValue) : res
  })
}

export function useFieldAttrs(
  fieldPath: MaybeRefOrGetter<string>,
  props: MaybeRefOrGetter<{
    label?: string
    labelAttributes?: LabelAttributes
    required?: boolean
    placeholder?: string
    resetLabelPath?: ResetLabelPathRule
  }>,
) {
  const { getLabelAttributes, getPlaceholder, getSchema } = useFormShared()

  const pathValue = toValue(fieldPath)
  const propsValue = toValue(props)

  const label = useFieldLabel(fieldPath, toRef(() => toValue(props).resetLabelPath))

  return computed(() => ({
    ...propsValue,
    placeholder: propsValue.placeholder ?? getPlaceholder(pathValue) ?? undefined,
    labelAttributes: propsValue.labelAttributes ?? getLabelAttributes(pathValue),
    label: propsValue.label ?? label.value,
    required: propsValue.required ?? getSchema(pathValue)?.required,
  }))
}
