<template>
  <div
    v-if="props.schema.referenceable"
    class="vault-secret-picker-provider"
  >
    <i18nT
      keypath="vault_secret_picker.provider.complete_action"
      scope="global"
    >
      <template #cta>
        <span
          class="vault-secret-picker-provider-action"
          @click="() => emit('open', props.value, props.update)"
        >
          {{ t('vault_secret_picker.provider.cta') }}
        </span>
      </template>
    </i18nT>
  </div>
</template>

<script setup lang="tsx">
import type { AutofillSlotProps } from '@kong-ui-public/forms'
import composables from '../composables'

const props = defineProps<AutofillSlotProps>()

const emit = defineEmits<{
  open: [AutofillSlotProps['value'], AutofillSlotProps['update']]
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
  }
}
</style>
