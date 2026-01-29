/**
 * Free-form Shared Exports
 *
 * This file exports shared components, composables, types, and utilities
 * from the free-form module for use in MCP Composer demo.
 *
 * ⚠️ WARNING: Use these exports with caution!
 * These are internal implementations and may change without notice.
 */

// ============================================================================
// Shared Form Components
// ============================================================================

export { default as Form } from './components/free-form/shared/Form.vue'
export { default as Field } from './components/free-form/shared/Field.vue'
export { default as EnumField } from './components/free-form/shared/EnumField.vue'
export { default as StringField } from './components/free-form/shared/StringField.vue'
export { default as NumberField } from './components/free-form/shared/NumberField.vue'
export { default as BooleanField } from './components/free-form/shared/BooleanField.vue'
export { default as RadioField } from './components/free-form/shared/RadioField.vue'
export { default as ObjectField } from './components/free-form/shared/ObjectField.vue'
export { default as ArrayField } from './components/free-form/shared/ArrayField.vue'
export { default as JsonField } from './components/free-form/shared/JsonField.vue'
export { default as StringArrayField } from './components/free-form/shared/StringArrayField.vue'
export { default as KeyValueField } from './components/free-form/shared/KeyValueField.vue'
export { default as ForeignField } from './components/free-form/shared/ForeignField.vue'
export { default as AdvancedFields } from './components/free-form/shared/AdvancedFields.vue'
export { default as EnhancedInput } from './components/free-form/shared/EnhancedInput.vue'
export { default as FieldRenderer } from './components/free-form/shared/FieldRenderer.vue'
export { default as VFGField } from './components/free-form/shared/VFGField.vue'
export { default as SlideTransition } from './components/free-form/shared/SlideTransition.vue'
export { default as EntityChecksAlert } from './components/free-form/shared/EntityChecksAlert.vue'
export { default as RedisConfigCard } from './components/free-form/shared/RedisConfigCard.vue'
export { default as RedisSelector } from './components/free-form/shared/RedisSelector.vue'
export { default as PluginFormWrapper } from './components/free-form/shared/PluginFormWrapper.vue'

// ============================================================================
// Shared Composables
// ============================================================================

export {
  provideFormShared,
  useOptionalFormShared,
  useFormShared,
  useField,
  useFieldAttrs,
  useSchemaHelpers,
  // Add other composables from shared/composables.ts as needed
} from './components/free-form/shared/composables'

// Headless composables
export {
  useKeyValueField,
  type KeyValueFieldProps,
  type KeyValueFieldEmits,
  type KVEntry,
} from './components/free-form/shared/headless/useKeyValueField'

