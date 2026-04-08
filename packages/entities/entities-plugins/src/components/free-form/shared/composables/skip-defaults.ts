import { nextTick, ref, type ShallowRef } from 'vue'
import { omit } from 'lodash-es'
import yaml, { JSON_SCHEMA } from 'js-yaml'
import { deepMergeConfig, stripDefaults } from '../utils'

type ConfigData = Record<string, any>
const PRESERVED_ROOT_KEYS = new Set(['config', 'enabled'])

interface UseSkipDefaultsOptions<T extends ConfigData = ConfigData> {
  getValue: () => T
  setValue: (data: T) => void
  getDefaultFromSchema: () => ConfigData
}

function hasOwn(data: ConfigData, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(data, key)
}

function preserveRootFields<T extends ConfigData>(source: T, stripped: T): T {
  const result: ConfigData = {}

  for (const key of Object.keys(source)) {
    if (hasOwn(stripped, key)) {
      result[key] = stripped[key]
      continue
    }

    if (!PRESERVED_ROOT_KEYS.has(key)) {
      continue
    }

    if (key === 'config' && source[key] != null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = {}
      continue
    }

    result[key] = source[key]
  }

  for (const key of Object.keys(stripped)) {
    if (!hasOwn(result, key)) {
      result[key] = stripped[key]
    }
  }

  return result as T
}

export function useSkipDefaults<T extends ConfigData = ConfigData>({
  getValue,
  setValue,
  getDefaultFromSchema,
}: UseSkipDefaultsOptions<T>) {
  const skipDefaults = ref(false)
  const isRegeneratingCode = ref(false)

  function toCode(data: T = getValue()): string {
    const displayData = omit(data, ['__ui_data']) as T
    const content = skipDefaults.value
      ? preserveRootFields(displayData, stripDefaults(displayData, getDefaultFromSchema()) as T)
      : displayData

    return yaml.dump(content, {
      schema: JSON_SCHEMA,
      noArrayIndent: true,
    })
  }

  function handleContentChange(config: T): T | null {
    if (isRegeneratingCode.value) {
      return null
    }

    const nextValue = skipDefaults.value
      ? deepMergeConfig(getValue(), config)
      : config

    setValue(nextValue)

    return nextValue
  }

  function regenerateCode(code: ShallowRef<string>, nextCode: string = toCode()) {
    isRegeneratingCode.value = true
    code.value = nextCode

    nextTick(() => {
      isRegeneratingCode.value = false
    })
  }

  return {
    skipDefaults,
    isRegeneratingCode,
    toCode,
    handleContentChange,
    regenerateCode,
  }
}
