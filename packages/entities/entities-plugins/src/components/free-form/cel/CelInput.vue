<template>
  <div
    class="ff-cel-input"
    :class="{ 'input-error': error }"
  >
    <KLabel
      v-if="label || $slots.label"
      :for="id"
      v-bind="labelAttributes"
      :required="required"
    >
      <slot name="label">
        {{ label }}
      </slot>
      <template
        v-if="$slots['label-tooltip']"
        #tooltip
      >
        <slot name="label-tooltip" />
      </template>
    </KLabel>

    <MonacoEditor
      :id="id"
      appearance="standalone"
      class="ff-cel-input-editor"
      :data-testid="path ? `ff-cel-${path}` : undefined"
      language="plaintext"
      :model-value="modelValue ?? ''"
      :options="editorOptions"
      :show-empty-state="false"
      :show-loading-state="false"
      :style="{ height: `${editorHeight}px` }"
      :theme="activeColorMode"
      @ready="ready"
      @update:model-value="update"
    />

    <div
      v-if="validate"
      class="ff-cel-input-validation"
    >
      <KButton
        appearance="tertiary"
        :data-testid="path ? `ff-cel-validate-${path}` : undefined"
        :disabled="disabled || !modelValue?.trim()"
        :loading="validating"
        size="small"
        type="button"
        @click="runValidation"
      >
        {{ t('plugins.free-form.cel.validate.action') }}
      </KButton>
      <span
        v-if="validation"
        class="ff-cel-input-validation-result"
        :class="`is-${validation.state}`"
        :data-testid="path ? `ff-cel-validation-${path}` : undefined"
        role="status"
      >
        {{ validation.message }}
      </span>
    </div>

    <p
      v-if="hintText"
      class="ff-cel-input-hint"
      :data-testid="path ? `ff-cel-hint-${path}` : undefined"
      role="status"
    >
      {{ hintText }}
    </p>
    <p
      v-if="error ? errorMessage : (help || $slots.help)"
      class="ff-cel-input-help"
    >
      <template v-if="error">
        {{ errorMessage }}
      </template>
      <slot
        v-else
        name="help"
      >
        {{ help }}
      </slot>
    </p>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import type { ComputedRef } from 'vue'
import { MonacoEditor } from '@kong-ui-public/monaco-editor'
import type { LabelAttributes } from '@kong/kongponents'
import type { editor, IDisposable } from 'monaco-editor'
import '@kong-ui-public/monaco-editor/dist/runtime/style.css'
import useI18n from '../../../composables/useI18n'
import { getCelScope } from './cel-catalog'
import { getCelHint } from './cel-hints'
import type { CelSubjects, CelSubjectValue } from './cel-subjects'
import { CEL_SUBJECTS_KEY, CEL_VALIDATE_KEY } from '../../../constants'
import { getCelValidationRequest, parseCelCompileError } from './cel-validation'
import type * as CelLanguage from './cel-language'

/**
 * The `CEL_INPUT_KEY` editor of `@kong-ui-public/freeform`: a `KTextArea` stand-in
 * that suggests the Gateway variables in scope for the field at `path`.
 */
defineOptions({ inheritAttrs: false })

const {
  modelValue,
  path = '',
  id,
  label,
  labelAttributes,
  required,
  placeholder,
  disabled,
  help,
  error,
  errorMessage,
  rows = 3,
} = defineProps<{
  modelValue?: string
  path?: string
  id?: string
  label?: string
  labelAttributes?: LabelAttributes
  required?: boolean
  placeholder?: string
  disabled?: boolean
  help?: string
  error?: boolean
  errorMessage?: string
  rows?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const { i18n: { t } } = useI18n()

const LINE_HEIGHT = 20
const PADDING = 16
const minHeight = computed(() => rows * LINE_HEIGHT + PADDING)
const editorHeight = ref(minHeight.value)

const scope = computed(() => getCelScope(path))
const hint = computed(() => getCelHint(modelValue ?? '', scope.value))
const hintText = computed(() => {
  const value = hint.value
  if (!value) return ''
  if (value.kind === 'alias') return t('plugins.free-form.cel.alias_hint', { typed: value.typed, expected: value.expected })
  if (value.kind === 'plugin-state') return t('plugins.free-form.cel.plugin_state_hint')
  if (value.kind === 'header-name') return t('plugins.free-form.cel.header_name_hint', { typed: value.typed, expected: value.expected })
  if (value.kind === 'unguarded') return t('plugins.free-form.cel.unguarded_hint', { field: value.field })
  if (value.kind === 'default') return t('plugins.free-form.cel.default_hint')
  if (value.kind === 'assignment') return t('plugins.free-form.cel.assignment_hint')
  if (value.kind === 'unknown-member') return t('plugins.free-form.cel.unknown_member_hint', { field: value.field, base: value.base, type: value.type })
  return t('plugins.free-form.cel.unknown_field_hint', { field: value.field })
})

// Records for value suggestions. The editor works without them while they load, or when a list is denied.
const loadSubjects = inject(CEL_SUBJECTS_KEY, undefined)
const subjects = shallowRef<CelSubjects>({})
const formatSubject = ({ kind, name, id }: CelSubjectValue) => {
  if (kind === 'principal-id') return t('plugins.free-form.cel.hover.principal', { name, id })
  if (kind === 'principal-group-id') return t('plugins.free-form.cel.hover.principal_group', { name, id })
  if (kind.startsWith('consumer-group')) return t('plugins.free-form.cel.hover.consumer_group', { name, id })
  return t('plugins.free-form.cel.hover.consumer', { name, id })
}

const activeColorMode = inject<ComputedRef<'light' | 'dark'>>('app:konnectColorMode', computed(() => 'light'))

const editorOptions = computed<Partial<editor.IStandaloneEditorConstructionOptions>>(() => ({
  ariaLabel: label || t('plugins.free-form.cel.editor_label'),
  placeholder,
  minimap: { enabled: false },
  automaticLayout: true,
  lineNumbers: 'off',
  glyphMargin: false,
  folding: false,
  lineDecorationsWidth: 8,
  lineNumbersMinChars: 0,
  fontSize: 13,
  lineHeight: LINE_HEIGHT,
  padding: { top: PADDING / 2, bottom: PADDING / 2 },
  wordWrap: 'on',
  fixedOverflowWidgets: true,
  formatOnType: false,
  formatOnPaste: false,
  scrollBeyondLastLine: false,
  scrollbar: { alwaysConsumeMouseWheel: false },
  readOnly: disabled,
  tabIndex: 0,
  quickSuggestions: { other: true, comments: false, strings: true },
  wordBasedSuggestions: 'off',
  suggest: { snippetsPreventQuickSuggestions: false },
  parameterHints: { enabled: true },
}))

const disposables: IDisposable[] = []
let unmounted = false

/** Held so the Validate button can mark the compiler's error in the source. */
const editorInstance = shallowRef<editor.IStandaloneCodeEditor>()
let setMarker: typeof CelLanguage.setCelCompileMarker | undefined

const ready = async (instance: editor.IStandaloneCodeEditor) => {
  // The editor loads asynchronously and can be ready after the field unmounts.
  if (unmounted) return
  const resize = () => {
    editorHeight.value = Math.max(minHeight.value, Math.min(256, instance.getContentHeight()))
  }
  disposables.push(instance.onDidContentSizeChange(resize))
  resize()
  const { attachCelLanguage, setCelCompileMarker } = await import('./cel-language')
  if (unmounted) return
  disposables.push(attachCelLanguage(instance, { scope: () => scope.value, subjects: () => subjects.value, formatSubject }))
  editorInstance.value = instance
  setMarker = setCelCompileMarker
  loadSubjects?.().then((loaded) => {
    if (!unmounted) subjects.value = loaded
  }).catch(() => {})
}

/**
 * The Gateway's verdict on the current text. Dropped as soon as the text changes,
 * so the user is never told that an expression they have since edited is valid.
 */
const validate = inject(CEL_VALIDATE_KEY, undefined)
const validating = ref(false)
const validation = ref<{ state: 'valid' | 'invalid' | 'unavailable', message: string }>()

const clearValidation = () => {
  validation.value = undefined
  if (editorInstance.value) setMarker?.(editorInstance.value)
}

watch(() => modelValue, clearValidation)

const runValidation = async () => {
  const expression = modelValue?.trim()
  if (!validate || !expression || validating.value) return

  validating.value = true
  try {
    const result = await validate(getCelValidationRequest(path, expression))
    // The text moved on while the request was in flight, so its verdict no longer applies.
    if (unmounted || expression !== modelValue?.trim()) return

    if (result.valid) {
      validation.value = { state: 'valid', message: t('plugins.free-form.cel.validate.valid') }
      if (editorInstance.value) setMarker?.(editorInstance.value)
      return
    }
    const error = parseCelCompileError(result.message || t('plugins.free-form.cel.validate.invalid'))
    validation.value = { state: 'invalid', message: error.message }
    if (editorInstance.value) setMarker?.(editorInstance.value, error)
  } catch {
    // The check itself failed, so the expression is not known to be wrong.
    if (!unmounted) validation.value = { state: 'unavailable', message: t('plugins.free-form.cel.validate.unavailable') }
  } finally {
    if (!unmounted) validating.value = false
  }
}

onBeforeUnmount(() => {
  unmounted = true
  disposables.forEach(disposable => disposable.dispose())
})

const update = (value: string) => {
  if (!disabled && value !== (modelValue ?? '')) emit('update:modelValue', value)
}
</script>

<style lang="scss" scoped>
.ff-cel-input {
  min-width: 0;

  .ff-cel-input-editor {
    border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    border-radius: var(--kui-border-radius-20, $kui-border-radius-20);
    overflow: hidden;
  }

  &.input-error .ff-cel-input-editor {
    border-color: var(--kui-color-border-danger, $kui-color-border-danger);
  }

  .ff-cel-input-validation {
    align-items: center;
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);
    margin-top: var(--kui-space-40, $kui-space-40);
  }

  .ff-cel-input-validation-result {
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    line-height: var(--kui-line-height-20, $kui-line-height-20);

    &.is-valid {
      color: var(--kui-color-text-success, $kui-color-text-success);
    }

    &.is-invalid {
      color: var(--kui-color-text-danger, $kui-color-text-danger);
    }

    &.is-unavailable {
      color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    }
  }

  .ff-cel-input-hint,
  .ff-cel-input-help {
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    line-height: var(--kui-line-height-20, $kui-line-height-20);
    margin: var(--kui-space-40, $kui-space-40) 0 0;
  }

  .ff-cel-input-hint {
    color: var(--kui-color-text-warning, $kui-color-text-warning);
  }

  .ff-cel-input-help {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  }

  &.input-error .ff-cel-input-help {
    color: var(--kui-color-text-danger, $kui-color-text-danger);
  }
}
</style>
