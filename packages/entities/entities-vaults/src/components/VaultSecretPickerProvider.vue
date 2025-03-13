<template>
  <div class="vault-secret-picker-provider">
    <i18nT
      keypath="vault_secret_picker.provider.complete_action"
      scope="global"
    >
      <template #cta>
        <span
          :class="{ 'vault-secret-picker-provider-action': true, 'disabled': props.disabled }"
          @click="() => !props.disabled && emit('open', props.value, props.update)"
        >
          {{ t('vault_secret_picker.provider.cta') }}
        </span>
      </template>
    </i18nT>
  </div>
</template>

<script setup lang="tsx">
import composables from '../composables'

type Props = {
  value: string
  disabled?: boolean
  update: (value: string) => void
}

const props = defineProps<Props>()

const emit = defineEmits<{
  open: [Props['value'], Props['update']]
}>()

const { i18n: { t }, i18nT } = composables.useI18n()
</script>

<style lang="scss" scoped>
.vault-secret-picker-provider {
  font-size: $kui-font-size-20;
  margin: $kui-space-40 0;

  &-action {
    color: $kui-color-text-primary;
    cursor: pointer;

    &.disabled {
      color: $kui-color-text-disabled;
      cursor: not-allowed;
    }
  }
}
</style>
