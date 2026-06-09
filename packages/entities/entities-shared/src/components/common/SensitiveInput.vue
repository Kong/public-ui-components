<template>
  <div
    ref="rootElement"
    class="kong-ui-public-sensitive-input"
  >
    <KInput
      autocomplete="off"
      data-testid="sensitive-input"
      :disabled="disabled"
      :error="error"
      :error-message="errorMessage"
      :help="help"
      :label="label"
      :label-attributes="labelAttributes"
      :model-value="isMasked ? maskedValue : modelValue"
      :placeholder="isMasked ? undefined : resolvedPlaceholder"
      :readonly="isMasked || readonly"
      :required="required"
      :type="inputType"
      @update:model-value="handleInput"
    >
      <template #after>
        <!-- Masked (editing an existing resource): only the Rotate key action -->
        <KButton
          v-if="isMasked"
          appearance="tertiary"
          class="sensitive-input-action"
          data-testid="sensitive-input-rotate"
          size="small"
          @click="enterEditing"
        >
          {{ t('sensitiveInput.rotateKey') }}
        </KButton>

        <!-- Editing: optional Generate key action + visibility toggle -->
        <template v-else>
          <KButton
            v-if="generateKey"
            appearance="tertiary"
            class="sensitive-input-action"
            data-testid="sensitive-input-generate"
            :disabled="disabled || isGenerating"
            size="small"
            @click="handleGenerate"
          >
            {{ t('sensitiveInput.generateKey') }}
          </KButton>
          <component
            :is="revealed ? VisibilityOffIcon : VisibilityIcon"
            :aria-label="revealed ? t('sensitiveInput.hideKey') : t('sensitiveInput.showKey')"
            class="sensitive-input-toggle"
            color="currentColor"
            data-testid="sensitive-input-toggle"
            role="button"
            :size="KUI_ICON_SIZE_40"
            tabindex="0"
            @click="toggleReveal"
            @keydown.enter.space.prevent="toggleReveal"
          />
        </template>
      </template>
    </KInput>

    <div
      v-if="showOneTimeHint"
      class="sensitive-input-hint"
      data-testid="sensitive-input-hint"
    >
      <InfoIcon
        class="sensitive-input-hint-icon"
        :color="KUI_COLOR_TEXT_INFO"
        :size="KUI_ICON_SIZE_40"
      />
      <span class="sensitive-input-hint-text">
        {{ t('sensitiveInput.oneTimeHint') }}
      </span>
      <KClipboardProvider v-slot="{ copyToClipboard }">
        <KButton
          appearance="none"
          class="sensitive-input-action sensitive-input-copy"
          data-testid="sensitive-input-copy"
          :icon="true"
          @click="copyToClipboard(modelValue)"
        >
          <CopyIcon
            color="currentColor"
            :size="KUI_ICON_SIZE_40"
          />
          {{ t('sensitiveInput.copy') }}
        </KButton>
      </KClipboardProvider>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { CopyIcon, InfoIcon, VisibilityIcon, VisibilityOffIcon } from '@kong/icons'
import {
  KUI_COLOR_TEXT_INFO,
  KUI_ICON_SIZE_40,
  KUI_SPACE_40,
  KUI_SPACE_50,
} from '@kong/design-tokens'
import composables from '../../composables'

const MASKED_VALUE = '••••••••••••••'

const {
  modelValue,
  mode = 'create',
  generateKey,
  showOneTimeHint = false,
  label,
  labelAttributes,
  placeholder,
  help,
  required = false,
  disabled = false,
  readonly = false,
  error = false,
  errorMessage,
} = defineProps<{
  /** The sensitive value, bound via v-model. */
  modelValue: string
  /**
   * `create` starts editable; `edit` starts masked (read-only) and reveals a
   * "Rotate key" action that switches the field to the editable state.
   */
  mode?: 'create' | 'edit'
  /**
   * When provided, a "Generate key" action is shown. The returned value is
   * written back through v-model and revealed. Generation logic (local crypto
   * or a backend call) lives with the caller.
   */
  generateKey?: () => string | Promise<string>
  /**
   * Caller-controlled one-time hint banner ("The key is shown only once…")
   * with a Copy action. When `true` the value is also revealed in plain text.
   */
  showOneTimeHint?: boolean
  label?: string
  labelAttributes?: Record<string, any>
  placeholder?: string
  help?: string
  required?: boolean
  disabled?: boolean
  readonly?: boolean
  error?: boolean
  errorMessage?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** Emitted when the user clicks "Rotate key" and enters the editable state. */
  rotate: []
  /** Emitted when key generation starts. */
  generate: []
  /** Emitted with the generated key once generation resolves. */
  generated: [key: string]
}>()

const { i18n: { t } } = composables.useI18n()

const internalMode = ref<'masked' | 'editing'>(mode === 'edit' ? 'masked' : 'editing')
const revealed = ref(false)
const isGenerating = ref(false)

const isMasked = computed(() => internalMode.value === 'masked')
const maskedValue = MASKED_VALUE
const resolvedPlaceholder = computed(() => placeholder ?? t('sensitiveInput.placeholder'))

// Masked state always renders as plain dots; otherwise the value follows the
// visibility toggle.
const inputType = computed<'text' | 'password'>(() => {
  if (isMasked.value) return 'text'
  return revealed.value ? 'text' : 'password'
})

// Reveal the value when the caller turns on the one-time hint.
watch(() => showOneTimeHint, (value) => {
  if (value) revealed.value = true
}, { immediate: true })

const handleInput = (value: string) => {
  emit('update:modelValue', value)
}

const enterEditing = () => {
  internalMode.value = 'editing'
  revealed.value = false
  emit('rotate')
}

const toggleReveal = () => {
  revealed.value = !revealed.value
}

const handleGenerate = async () => {
  if (!generateKey || isGenerating.value) return

  isGenerating.value = true
  emit('generate')

  try {
    const key = await generateKey()
    emit('update:modelValue', key)
    revealed.value = true
    emit('generated', key)
  } finally {
    isGenerating.value = false
  }
}

// KInput measures the `after` slot width only once on mount to compute the
// native input's `padding-right`. Since our `after` slot content changes
// (Rotate key → Generate key + eye → eye only), that one-time measurement
// becomes stale. We observe the rendered after-content wrapper and drive the
// input's `padding-right` ourselves (via the `inputPaddingRight` CSS binding
// below), reusing KInput's own formula: `calc(space-50 + after-width + space-40)`.
const rootElement = ref<HTMLElement>()
let resizeObserver: ResizeObserver | undefined

// Mirrors KInput's pre-measurement default (`space-50 + icon-size-40 + space-40`)
// so the padding doesn't jump on the first frame.
const inputPaddingRight = ref(`calc(${KUI_SPACE_50} + ${KUI_ICON_SIZE_40} + ${KUI_SPACE_40})`)

const syncInputPadding = () => {
  const afterContent = rootElement.value?.querySelector<HTMLElement>('.after-content-wrapper')
  if (!afterContent) return

  inputPaddingRight.value = `calc(${KUI_SPACE_50} + ${afterContent.offsetWidth}px + ${KUI_SPACE_40})`
}

onMounted(() => {
  const afterContent = rootElement.value?.querySelector<HTMLElement>('.after-content-wrapper')

  // Re-measure whenever the after-content wrapper resizes (e.g. its content swaps).
  resizeObserver = new ResizeObserver(() => syncInputPadding())
  if (afterContent) {
    resizeObserver.observe(afterContent)
  }
  syncInputPadding()
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<style lang="scss" scoped>
.kong-ui-public-sensitive-input {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  :deep(.after-content-wrapper) {
    align-items: center;
    gap: var(--kui-space-20, $kui-space-20) !important;
  }

  // Override KInput's one-time-measured padding-right with our dynamically computed value
  :deep(.input) {
    padding-right: v-bind(inputPaddingRight) !important;
  }

  .sensitive-input-action {
    color: var(--kui-color-text-primary, $kui-color-text-primary);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    white-space: nowrap;
  }

  .sensitive-input-toggle {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    cursor: pointer;
  }

  .sensitive-input-hint {
    align-items: center;
    background-color: var(--kui-color-background-info-weakest, $kui-color-background-info-weakest);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    color: var(--kui-color-text-info, $kui-color-text-info);
    display: flex;
    gap: var(--kui-space-40, $kui-space-40);
    padding: var(--kui-space-40, $kui-space-40) var(--kui-space-50, $kui-space-50);

    .sensitive-input-hint-icon {
      flex-shrink: 0;
    }

    .sensitive-input-hint-text {
      flex: 1;
      font-size: var(--kui-font-size-30, $kui-font-size-30);
    }

    .sensitive-input-copy {
      display: inline-flex;
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      gap: var(--kui-space-20, $kui-space-20);
    }
  }
}
</style>
