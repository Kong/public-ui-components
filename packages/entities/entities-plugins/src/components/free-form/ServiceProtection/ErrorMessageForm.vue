<template>
  <div>
    <KLabel
      for="sp-form-error-legend"
      :info="t('sp.error_message.help')"
      required
      :tooltip-attributes="{
        maxWidth: '300',
        placement: 'top',
      }"
    >
      {{ t('sp.error_message.label') }}
    </KLabel>

    <legend
      id="sp-form-error-legend"
      class="sp-form-error-inputs"
    >
      <NumberField
        class="input-error-code"
        label=""
        name="error_code"
        :placeholder="t('sp.error_message.code_placeholder')"
      />
      <div>:</div>
      <StringField
        class="input-error-message"
        label=""
        name="error_message"
        :placeholder="t('sp.error_message.message_placeholder')"
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
.sp-form-error-inputs {
  align-items: center;
  display: flex;
  flex-direction: row;
  gap: var(--kui-space-50, $kui-space-50);
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
