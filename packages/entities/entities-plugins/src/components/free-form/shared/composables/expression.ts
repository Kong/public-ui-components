import { computed, toValue } from 'vue'
import { get, set } from 'lodash-es'
import { useFormShared } from './form-context'
import * as utils from '../utils'

import type { MaybeRefOrGetter } from 'vue'
import type { ExpressionFieldSchema, FieldSchemaType, UnionFieldSchema } from '../../../../types/plugins/form-schema'
import type { EmptyValue } from '../types'

/**
 * Name of the root record holding the expression twins of `expressible` fields.
 */
export const EXPRESSIONS_FIELD = 'expressions'

/**
 * Maps a field path to the path of its expression twin.
 *
 * The `expressions` record mirrors the structure of the top-level record its
 * expressible fields live in (`config`, for every plugin schema today), so the
 * twin path is the field path with its first segment swapped:
 *
 * @example
 * toExpressionPath('config.minute')   // => 'expressions.minute'
 * toExpressionPath('config.limit.0')  // => 'expressions.limit.0'
 * toExpressionPath('minute')          // => undefined — a root field has no twin
 */
export function toExpressionPath(path: string): string | undefined {
  const parts = utils.toArray(utils.removeRootSymbol(path))
  if (parts.length < 2) return undefined
  return utils.resolve(EXPRESSIONS_FIELD, ...parts.slice(1))
}

/**
 * Whether a schema is the expression twin of an `expressible` field.
 *
 * `expressible_kong_type` is the marker rather than the source field's
 * `expressible` flag, because the two do not always sit at the same path: for an
 * expressible *array* (rate-limiting-advanced's `config.limit`) the flag is on
 * the array while the twins are per element, so only the twin marks every path
 * that actually takes an expression.
 */
export function isExpressionFieldSchema(
  schema: UnionFieldSchema | undefined,
): schema is ExpressionFieldSchema {
  return !!schema && schema.type === 'string' && 'expressible_kong_type' in schema
}

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
      // `expressions` starts out as the empty sentinel (it is never `required`),
      // so the record — and, for `expressions.limit.0`, the array — is created
      // here on first write.
      set(formData, utils.toArray(expressionPath.value), newValue)
    },
  })

  const hasExpression = computed(() => typeof value.value === 'string' && value.value !== '')

  /** The type the expression must evaluate to. */
  const kongType = computed<FieldSchemaType | undefined>(() => schema.value?.expressible_kong_type)

  /**
   * Follows the source field: an expression for a field the render rules have
   * hidden has nothing to override.
   */
  const hide = computed(() => isFieldHidden(path.value))

  /** Unset the expression, so the field falls back to its plain value. */
  function clear() {
    value.value = getEmptyValue()
  }

  return {
    available,
    expressionPath,
    schema,
    value,
    hasExpression,
    kongType,
    hide,
    clear,
  }
}
