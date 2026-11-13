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
import { computed, inject, onBeforeUnmount, ref, shallowRef } from 'vue'
import type { ComputedRef } from 'vue'
import { MonacoEditor } from '@kong-ui-public/monaco-editor'
import type { LabelAttributes } from '@kong/kongponents'
import type { editor, IDisposable } from 'monaco-editor'
import '@kong-ui-public/monaco-editor/dist/runtime/style.css'
import useI18n from '../composables/useI18n'
import { getCelScope } from '../cel/cel-catalog'
import { attachCelLanguage } from '../cel/cel-language'
import { getCelHint } from '../cel/cel-hints'
import type { CelSubjects, CelSubjectValue } from '../cel/cel-subjects'
import { CEL_SUBJECTS_KEY } from '../constants'

/**
 * The CEL editor that `CelField` renders under `USE_CEL_EDITOR_KEY`: a `KTextArea`
 * stand-in that suggests the Gateway variables in scope for the field at `path`.
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
  if (value.kind === 'alias') return t('cel.alias_hint', { typed: value.typed, expected: value.expected })
  if (value.kind === 'plugin-state') return t('cel.plugin_state_hint')
  if (value.kind === 'header-name') return t('cel.header_name_hint', { typed: value.typed, expected: value.expected })
  if (value.kind === 'unguarded') return t('cel.unguarded_hint', { field: value.field })
  if (value.kind === 'default') return t('cel.default_hint')
  if (value.kind === 'assignment') return t('cel.assignment_hint')
  if (value.kind === 'unknown-member') return t('cel.unknown_member_hint', { field: value.field, base: value.base, type: value.type })
  return t('cel.unknown_field_hint', { field: value.field })
})

// Records for value suggestions. The editor works without them while they load, or when a list is denied.
const loadSubjects = inject(CEL_SUBJECTS_KEY, undefined)
const subjects = shallowRef<CelSubjects>({})
const formatSubject = ({ kind, name, id }: CelSubjectValue) => {
  if (kind === 'principal-id') return t('cel.hover.principal', { name, id })
  if (kind === 'principal-group-id') return t('cel.hover.principal_group', { name, id })
  if (kind.startsWith('consumer-group')) return t('cel.hover.consumer_group', { name, id })
  return t('cel.hover.consumer', { name, id })
}

const activeColorMode = inject<ComputedRef<'light' | 'dark'>>('app:konnectColorMode', computed(() => 'light'))

const editorOptions = computed<Partial<editor.IStandaloneEditorConstructionOptions>>(() => ({
  ariaLabel: label || t('cel.editor_label'),
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

const ready = (instance: editor.IStandaloneCodeEditor) => {
  // The editor loads asynchronously and can be ready after the field unmounts.
  if (unmounted) return
  const resize = () => {
    editorHeight.value = Math.max(minHeight.value, Math.min(256, instance.getContentHeight()))
  }
  disposables.push(instance.onDidContentSizeChange(resize))
  resize()
  disposables.push(attachCelLanguage(instance, { scope: () => scope.value, subjects: () => subjects.value, formatSubject }))
  loadSubjects?.().then((loaded) => {
    if (!unmounted) subjects.value = loaded
  }).catch(() => {})
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
