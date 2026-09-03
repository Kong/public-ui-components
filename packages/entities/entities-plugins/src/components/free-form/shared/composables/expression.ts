import { computed, toValue } from 'vue'
import { get, set } from 'lodash-es'
import { useFormShared } from './form-context'
import * as utils from '../utils'
import { EXPRESSION_ARRAY_EMPTY, isExpressionFieldSchema, toExpressionPath } from './expression-paths'

import type { MaybeRefOrGetter } from 'vue'
import type { ExpressionFieldSchema, FieldSchemaType } from '../../../../types/plugins/form-schema'
import type { EmptyValue } from '../types'

/**
 * State for the optional expression that can override a field's plain value.
 *
 * Reads and writes `formData` at the twin path directly rather than going
 * through `useFieldPath`/`useFormData`: those provide their own field path to
 * descendants, and this composable is called from `Field.vue` alongside the
 * field's own `useField`, where overriding that provide would break relative
 * path resolution for everything the field renders.
 *
 * @param configPath The **resolved** path of the expressible field, with or
 * without the `$.` root prefix (e.g. `Field.vue` passes `field.path`).
 */
export function useExpressionField(configPath: MaybeRefOrGetter<string>) {
  const { getSchema, getEmptyValue, isFieldHidden, formData } = useFormShared()

  const path = computed(() => utils.removeRootSymbol(toValue(configPath)))
  const expressionPath = computed(() => toExpressionPath(path.value))

  const schema = computed(() => expressionPath.value
    ? getSchema<ExpressionFieldSchema>(expressionPath.value)
    : undefined)

  /**
   * Whether this field has an expression twin to render. Schemas with no
   * `expressions` record — every plugin but rate-limiting and
   * rate-limiting-advanced today — resolve to `false` and render nothing.
   */
  const available = computed(() => isExpressionFieldSchema(schema.value))

  const value = computed<string | EmptyValue>({
    get: () => expressionPath.value
      ? get(formData, utils.toArray(expressionPath.value))
      : undefined,
    set: (newValue) => {
      if (!expressionPath.value) return

      if (isArrayElement.value) {
        writeArraySlot(newValue)
        return
      }

      // `expressions` starts out as the empty sentinel (it is never `required`),
      // so the record is created here on first write.
      set(formData, utils.toArray(expressionPath.value), newValue)
    },
  })

  /**
   * Writes one slot of a twin array, rebuilding the array around it.
   *
   * Setting an index straight into a missing array leaves holes in front of it,
   * and a hole serializes as `null` — which the Gateway rejects, since its
   * schema framework makes every array element `required` with no opt-out. So
   * the array is materialized at the same length as the source it mirrors, with
   * `''` in every literal slot, and any existing hole or `null` is repaired on
   * the way through.
   *
   * Full length rather than just up to this index on purpose: the Gateway pairs
   * the two arrays by position *as submitted* and only then sorts `limit`
   * ascending, carrying each expression along with its original pair. Relying on
   * it to right-pad a short array is only safe when the source is already
   * sorted, so sending every slot keeps each expression unambiguously bound.
   */
  function writeArraySlot(newValue: string | EmptyValue) {
    const twinParts = utils.toArray(expressionPath.value!)
    const index = Number(twinParts[twinParts.length - 1])
    const twinArrayPath = twinParts.slice(0, -1)

    const sourceArray = get(formData, utils.toArray(path.value).slice(0, -1))
    const length = Math.max(
      Array.isArray(sourceArray) ? sourceArray.length : 0,
      index + 1,
    )

    const existing = get(formData, twinArrayPath)
    const next = Array.from({ length }, (_, slot) => {
      const current = Array.isArray(existing) ? existing[slot] : undefined
      return typeof current === 'string' ? current : EXPRESSION_ARRAY_EMPTY
    })
    next[index] = newValue ?? EXPRESSION_ARRAY_EMPTY

    set(formData, twinArrayPath, next)
  }

  const hasExpression = computed(() => typeof value.value === 'string' && value.value !== '')

  /** The type the expression must evaluate to. */
  const kongType = computed<FieldSchemaType | undefined>(() => schema.value?.expressible_kong_type)

  /**
   * Follows the source field: an expression for a field the render rules have
   * hidden has nothing to override.
   */
  const hide = computed(() => isFieldHidden(path.value))

  /**
   * Whether this twin is an element of a twin array, which the Gateway pairs
   * with its source array by position rather than by name.
   */
  const isArrayElement = computed(() => {
    if (!expressionPath.value) return false

    const parts = utils.toArray(expressionPath.value)
    if (parts.length < 2) return false

    return getSchema(utils.resolve(...parts.slice(0, -1)))?.type === 'array'
  })

  /**
   * What "no expression" is at this path: an empty string inside a twin array,
   * so the slot keeps its position, and the configured sentinel anywhere else,
   * so a scalar twin is genuinely unset. See {@link EXPRESSION_ARRAY_EMPTY}.
   */
  const emptyValue = computed<string | EmptyValue>(() =>
    isArrayElement.value ? EXPRESSION_ARRAY_EMPTY : getEmptyValue())

  /** Unset the expression, so the field falls back to its plain value. */
  function clear() {
    value.value = emptyValue.value
  }

  return {
    available,
    expressionPath,
    schema,
    value,
    hasExpression,
    kongType,
    hide,
    isArrayElement,
    emptyValue,
    clear,
  }
}
