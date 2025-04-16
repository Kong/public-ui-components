<template>
  <ObjectField
    hide-required-asterisk
    name="response"
    required
  >
    <ObjectField
      hide-required-asterisk
      label="Response › Headers"
      name="headers"
      required
    >
      <BooleanField
        label="Response › Headers › Store"
        name="store"
      />
    </ObjectField>
    <ObjectField
      hide-required-asterisk
      label="Response › Body"
      name="body"
      required
    >
      <BooleanField
        label="Response › Body › Store"
        name="store"
      />
      <BooleanField
        label="Response › Body › Decode"
        name="decode"
      />
    </ObjectField>
    <StringField
      autosize
      class="rc-code"
      label="Response › By Lua"
      multiline
      name="by_lua"
      :placeholder="t('plugins.free-form.request-callout.by_lua_placeholder')"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import BooleanField from '../shared/BooleanField.vue'
import ObjectField from '../shared/ObjectField.vue'
import StringField from '../shared/StringField.vue'
import useI18n from '../../../composables/useI18n'

const { i18n: { t } } = useI18n()
</script>
