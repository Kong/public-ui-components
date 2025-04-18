<template>
  <ObjectField name="response">
    <ObjectField
      label="Response › Headers"
      name="headers"
    >
      <BooleanField
        label="Response › Headers › Store"
        name="store"
      />
    </ObjectField>
    <ObjectField
      label="Response › Body"
      name="body"
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
