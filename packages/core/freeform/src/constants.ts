import type { InjectionKey, Ref } from 'vue'
import type { CelLanguage } from '@kong-ui-public/monaco-editor/languages/cel'

export const USE_SECRET_INPUT_KEY = Symbol.for('kong-ui-public:entities-plugins:use-secret-input') as InjectionKey<Ref<boolean>>

export const FREE_FORM_SCHEMA_MAP_KEY = '__FREEFORM_SCHEMA_MAP__'

/** Resolves an explicitly selected CEL language key; undefined preserves the existing input. */
export const CEL_INPUT_KEY = Symbol.for('kong-ui-public:freeform:cel-input') as InjectionKey<
  (language: string) => { language: CelLanguage } | undefined
>

/**
 * Finds the control to focus inside a rendered field: the first enabled
 * input, textarea, select, button or other tabbable element. Not every
 * focusable element (e.g. links), only what field components render.
 */
export const FOCUSABLE_SELECTOR = 'input:not(:disabled), textarea:not(:disabled), select:not(:disabled), button:not(:disabled), [contenteditable="true"], [tabindex]:not([tabindex="-1"]):not(:disabled)'
