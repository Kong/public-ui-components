import { computed, inject, provide, toValue, useSlots } from 'vue'
import { FIELD_PATH_KEY, FIELD_RENDERER_SLOTS, FIELD_RENDERERS } from './constants'
import { generalizePath } from './schema'
import { useFormShared } from './form-context'
import * as utils from '../utils'

import type { MaybeRefOrGetter, Slot } from 'vue'

export const useFieldPath = (name: MaybeRefOrGetter<string>) => {
  const inheritedPath = inject(FIELD_PATH_KEY, computed(() => ''))

  const fieldPath = computed(() => {
    const nameValue = toValue(name)
    let res = nameValue

    // concat relative path
    if (!utils.isAbsolute(nameValue) && inheritedPath.value) {
      res = utils.resolve(inheritedPath.value, nameValue)
    }

    // remove $. from name
    if (utils.isAbsolute(nameValue)) {
      res = res.slice(utils.resolveRoot('').length)
    }
    return res
  })

  provide(FIELD_PATH_KEY, fieldPath)

  return fieldPath
}

export const useFieldRenderer = (path: MaybeRefOrGetter<string>) => {
  const { getSchema, fieldRendererRegistry } = useFormShared()
  const { default: defaultSlot, ...slots } = useSlots()
  const inheritSlots = inject(FIELD_RENDERER_SLOTS)

  const mergedSlots = computed(() => {
    const inheritSlotsValue = toValue(inheritSlots)
    // Set relative path to each slot key
    const childSlots: Record<string, Slot<any> | undefined> = Object.keys(slots)
      .filter(k => k !== FIELD_RENDERERS && k !== 'item')
      .reduce((res, key) => {
        const newKey = generalizePath(utils.resolve(toValue(path), key))
        return { ...res, [newKey]: slots[key] }
      }, {})
    return inheritSlotsValue ? { ...inheritSlotsValue, ...childSlots } : childSlots
  })

  provide(FIELD_RENDERER_SLOTS, mergedSlots)

  const pathValue = toValue(path)

  return computed(() => {
    if (defaultSlot) return
    const matchedByPath = mergedSlots.value[generalizePath(toValue(path))]
    if (matchedByPath) return matchedByPath

    // todo(zehao): priority
    for (const [matcher, slot] of fieldRendererRegistry) {
      if (matcher({ path: pathValue, schema: getSchema(pathValue)! })) {
        return slot
      }
    }
    return undefined
  })
}
