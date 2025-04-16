<template>
  <ObjectField
    appearance="card"
    hide-required-asterisk
    name="upstream"
    required
  >
    <ObjectField
      hide-required-asterisk
      label="Upstream › Headers"
      name="headers"
      required
    >
      <BooleanField
        label="Upstream › Headers › Forward"
        name="forward"
      />

      <KeyValueField
        label="Upstream › Headers › Custom"
        name="custom"
      />
    </ObjectField>

    <ObjectField
      hide-required-asterisk
      label="Upstream › Query"
      name="query"
      required
    >
      <BooleanField
        label="Upstream › Query › Forward"
        name="forward"
      />

      <KeyValueField
        label="Upstream › Query › Custom"
        name="custom"
      />
    </ObjectField>

    <ObjectField
      label="Upstream › Body"
      name="body"
    >
      <BooleanField
        label="Upstream › Body › Forward"
        name="forward"
      />

      <BooleanField
        label="Upstream › Body › Decode"
        name="decode"
      />

      <KeyValueField
        label="Upstream › Body › Custom"
        name="custom"
      />
    </ObjectField>

    <StringField
      autosize
      class="rc-code"
      label="Upstream › By Lua"
      multiline
      name="by_lua"
      :placeholder="t('plugins.free-form.request-callout.by_lua_placeholder')"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import KeyValueField from '../shared/KeyValueField.vue'
import ObjectField from '../shared/ObjectField.vue'
import BooleanField from '../shared/BooleanField.vue'
import StringField from '../shared/StringField.vue'
import useI18n from '../../../composables/useI18n'

const { i18n: { t } } = useI18n()
</script>
