import { computed, inject } from 'vue'
import { FEATURE_FLAGS } from '../../../../constants'

import type { FormSchema, NamedFieldSchema, RecordFieldSchema } from '../../../../types/plugins/form-schema'

/**
 * Gates expression mode on a plugin's expressible fields behind the 3.16
 * feature flag.
 *
 * Shadows the `expressible` marker rather than removing anything: the fields,
 * their values and the `expressions` record all stay exactly as the Gateway
 * sent them, so every field still renders and its data still round-trips — only
 * the expression editor beside it goes away. Turning the flag on restores it
 * with nothing else changed.
 *
 * @param schema The plugin's raw schema, from `PluginFormLayoutProps`.
 */
export function useExpressionMode(schema: () => FormSchema) {
  const enabled = inject<boolean>(FEATURE_FLAGS.KM_3034_FEATURES_316, false)

  const gatedSchema = computed<FormSchema>(() => {
    const value = schema()
    if (enabled || !Array.isArray(value?.fields)) return value

    return {
      ...value,
      fields: value.fields.map(shadowExpressible),
    }
  })

  return { expressionModeEnabled: enabled, gatedSchema }
}

/**
 * Clears `expressible` from a field and, recursively, from a record's own
 * fields — the marker can sit on a nested field as readily as a top-level one.
 */
function shadowExpressible(field: NamedFieldSchema): NamedFieldSchema {
  const name = Object.keys(field)[0]
  const { expressible, ...rest } = field[name]

  const record = rest as RecordFieldSchema
  return {
    [name]: Array.isArray(record.fields)
      ? { ...record, fields: record.fields.map(shadowExpressible) }
      : rest,
  } as NamedFieldSchema
}
