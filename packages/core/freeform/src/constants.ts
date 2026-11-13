import type { InjectionKey, Ref } from 'vue'
import type { CelSubjects } from '@kong-ui-public/monaco-editor/languages/cel'

export const USE_SECRET_INPUT_KEY = Symbol.for('kong-ui-public:entities-plugins:use-secret-input') as InjectionKey<Ref<boolean>>

export const FREE_FORM_SCHEMA_MAP_KEY = '__FREEFORM_SCHEMA_MAP__'

/**
 * Whether `CelField` (and so every `ExpressionEditor`) renders the CEL editor:
 * Monaco, with suggestions, hover and hints scoped to the field's path. Without
 * it, `CelField` renders a textarea.
 */
export const USE_CEL_EDITOR_KEY = Symbol.for('kong-ui-public:freeform:use-cel-editor') as InjectionKey<boolean>

/**
 * Loads the records that CEL expressions can name, for value suggestions in the
 * CEL editor. Called when an editor opens; repeated calls should share one request.
 */
export const CEL_SUBJECTS_KEY = Symbol.for('kong-ui-public:freeform:cel-subjects') as InjectionKey<() => Promise<CelSubjects>>

/**
 * Finds the control to focus inside a rendered field: the first enabled
 * input, textarea, select, button or other tabbable element. Not every
 * focusable element (e.g. links), only what field components render.
 */
export const FOCUSABLE_SELECTOR = 'input:not(:disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled), [contenteditable="true"], [tabindex]:not([tabindex="-1"]):not(:disabled)'
