<template>
  <ObjectField
    appearance="card"
    label="Upstream"
    :label-attributes="getLabelAttributes('upstream')"
    required
  >
    <ObjectField
      label="Upstream › Headers"
      :label-attributes="getLabelAttributes('upstream.headers')"
      required
    >
      <BooleanField
        v-model="upstream.headers.forward"
        label="Upstream › Headers › Forward"
        :label-attributes="getLabelAttributes('upstream.headers.forward')"
      />

      <KeyValueField
        :initial-value="upstream.headers.custom"
        label="Upstream › Headers › Custom"
        :label-attributes="getLabelAttributes('upstream.headers.custom')"
        show-vault-secret-picker
        @change="val => upstream.headers.custom = val"
      />
    </ObjectField>

    <ObjectField
      label="Upstream › Query"
      :label-attributes="getLabelAttributes('upstream.query')"
      required
    >
      <BooleanField
        v-model="upstream.query.forward"
        label="Upstream › Query › Forward"
        :label-attributes="getLabelAttributes('upstream.query.forward')"
      />

      <KeyValueField
        :initial-value="upstream.query.custom"
        label="Upstream › Query › Custom"
        :label-attributes="getLabelAttributes('upstream.query.custom')"
        show-vault-secret-picker
        @change="val => upstream.query.custom = val"
      />
    </ObjectField>

    <ObjectField
      label="Upstream › Body"
      required
    >
      <BooleanField
        v-model="upstream.body.forward"
        label="Upstream › Body › Forward"
        :label-attributes="getLabelAttributes('upstream.body.forward')"
      />

      <BooleanField
        v-model="upstream.body.decode"
        label="Upstream › Body › Decode"
        :label-attributes="getLabelAttributes('upstream.body.decode')"
      />

      <KeyValueField
        :initial-value="upstream.body.custom"
        label="Upstream › Body › Custom"
        :label-attributes="getLabelAttributes('upstream.body.custom')"
        show-vault-secret-picker
        @change="val => upstream.body.custom = val"
      />
    </ObjectField>

    <StringField
      v-model.trim="upstream.by_lua"
      autosize
      class="rc-code"
      label="Upstream › By Lua"
      :label-attributes="getLabelAttributes('upstream.by_lua')"
      multiline
      :placeholder="t('plugins.free-form.request-callout.by_lua_placeholder')"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormShared } from '../shared/composables'
import KeyValueField from '../shared/KeyValueField.vue'
import ObjectField from '../shared/ObjectField.vue'
import BooleanField from '../shared/BooleanField.vue'
import StringField from '../shared/StringField.vue'
import type { RequestCallout } from './types'
import useI18n from '../../../composables/useI18n'

const { i18n: { t } } = useI18n()

const { formData, getLabelAttributes } = useFormShared<RequestCallout>()

const upstream = computed(() => formData.upstream)
</script>
