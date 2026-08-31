<template>
  <KInput
    v-bind="$attrs"
    autocapitalize="off"
    :autocomplete="autocomplete"
    autocorrect="off"
    :class="{ 'secret-input-masked': maskedModel }"
    :model-value="model"
    spellcheck="false"
    :type="inputType"
    @copy.capture="blockMaskedExtraction"
    @cut.capture="blockMaskedExtraction"
    @dragstart.capture="blockMaskedExtraction"
    @update:model-value="model = $event"
  >
    <template
      v-for="(_, name) in forwardedSlots()"
      #[name]="slotProps"
    >
      <slot
        :name="name"
        v-bind="slotProps"
      />
    </template>

    <template
      v-if="showMaskToggle || slots.after"
      #after
    >
      <slot
        :masked="maskedModel"
        name="after"
        :toggle="toggleMask"
      />
      <KButton
        v-if="showMaskToggle"
        appearance="none"
        :aria-label="maskedModel ? resolvedShowLabel : resolvedHideLabel"
        :aria-pressed="!maskedModel"
        class="secret-input-toggle mask-value-toggle-button"
        data-testid="secret-input-toggle"
        icon
        type="button"
        @click="toggleMask"
      >
        <component
          :is="maskedModel ? VisibilityIcon : VisibilityOffIcon"
          color="currentColor"
          decorative
          :size="`var(--kui-icon-size-40, ${KUI_ICON_SIZE_40})`"
        />
      </KButton>
    </template>
  </KInput>
</template>

<script setup lang="ts">
import { computed, useSlots } from 'vue'
import { VisibilityIcon, VisibilityOffIcon } from '@kong/icons'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'
import composables from '../../composables'

defineOptions({ inheritAttrs: false })

const {
  autocomplete = 'off',
  showLabel,
  hideLabel,
  showMaskToggle = true,
} = defineProps<{
  autocomplete?: string
  showLabel?: string
  hideLabel?: string
  showMaskToggle?: boolean
}>()

const [model, modelModifiers] = defineModel<string>({
  default: '',
  set: (value) => modelModifiers.trim ? value.trim() : value,
})
const maskedModel = defineModel<boolean>('masked', { default: true })

const { i18n: { t } } = composables.useI18n()
const resolvedShowLabel = computed(() => showLabel ?? t('secretInput.show'))
const resolvedHideLabel = computed(() => hideLabel ?? t('secretInput.hide'))
const slots = useSlots()
const forwardedSlots = () => Object.fromEntries(
  Object.entries(slots).filter(([name]) => name !== 'after'),
)
const supportsTextSecurity = typeof CSS !== 'undefined' && typeof CSS.supports === 'function' && CSS.supports('-webkit-text-security', 'disc')
const inputType = computed(() => maskedModel.value && !supportsTextSecurity ? 'password' : 'text')

const toggleMask = () => {
  maskedModel.value = !maskedModel.value
}
const blockMaskedExtraction = (event: Event) => {
  if (maskedModel.value) event.preventDefault()
}
</script>

<style lang="scss" scoped>
.secret-input-masked :deep(input) {
  -webkit-text-security: disc;
}

.secret-input-masked :deep(input[type="password"]::-ms-reveal) {
  display: none;
}

.secret-input-toggle {
  color: var(--kui-color-text-neutral, $kui-color-text-neutral);
  cursor: pointer;
}
</style>
