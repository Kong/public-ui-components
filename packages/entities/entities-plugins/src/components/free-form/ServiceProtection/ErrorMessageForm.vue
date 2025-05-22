<template>
  <div>
    <KLabel
      for="rla-form-error-legend"
      :info="t('rla.error_message.help')"
      required
      :tooltip-attributes="{
        maxWidth: '300',
        placement: 'top',
      }"
    >
      {{ t('rla.error_message.label') }}
    </KLabel>

    <legend
      id="rla-form-error-legend"
      class="rla-form-error-inputs"
    >
      <NumberField
        class="input-error-code"
        label=""
        name="error_code"
        :placeholder="t('rla.error_message.code_placeholder')"
      />
      <div>:</div>
      <StringField
        class="input-error-message"
        label=""
        name="error_message"
        :placeholder="t('rla.error_message.message_placeholder')"
      />
    </legend>
  </div>
</template>

<script setup lang="ts">
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../locales/en.json'
import StringField from '../shared/StringField.vue'
import NumberField from '../shared/NumberField.vue'

const { t } = createI18n<typeof english>('en-us', english)
</script>

<style lang="scss" scoped>
.rla-form-error-inputs {
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: $kui-space-50;
  justify-content: space-between;

  .input-error-code {
    max-width: 200px;
    min-width: 100px;
    width: 20%;
  }

  .input-error-message {
    width: 100%;
  }
}
</style>
