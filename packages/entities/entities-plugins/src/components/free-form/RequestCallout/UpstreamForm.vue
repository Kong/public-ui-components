<!-- eslint-disable vue/no-mutating-props -->
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
        label="Upstream › Headers › Forward"
        :label-attributes="getLabelAttributes('upstream.headers.forward')"
        :model-value="formData.upstream.headers.forward ?? false"
        @update:model-value="formData.upstream.headers.forward = $event"
      />

      <KeyValueField
        :initial-value="formData.upstream.headers.custom"
        label="Upstream › Headers › Custom"
        :label-attributes="getLabelAttributes('upstream.headers.custom')"
        @change="handleCustomChange('headers', $event)"
      />
    </ObjectField>

    <ObjectField
      label="Upstream › Query"
      :label-attributes="getLabelAttributes('upstream.query')"
      required
    >
      <BooleanField
        label="Upstream › Query › Forward"
        :label-attributes="getLabelAttributes('upstream.query.forward')"
        :model-value="formData.upstream.query.forward ?? false"
        @update:model-value="formData.upstream.query.forward = $event"
      />

      <KeyValueField
        :initial-value="formData.upstream.query.custom"
        label="Upstream › Query › Custom"
        :label-attributes="getLabelAttributes('upstream.query.custom')"
        @change="handleCustomChange('query', $event)"
      />
    </ObjectField>

    <ObjectField
      label="Upstream › Body"
      required
    >
      <BooleanField
        label="Upstream › Body › Forward"
        :label-attributes="getLabelAttributes('upstream.body.forward')"
        :model-value="formData.upstream.body.forward ?? false"
        @update:model-value="formData.upstream.body.forward = $event"
      />

      <KeyValueField
        :initial-value="formData.upstream.body.custom"
        label="Upstream › Body › Custom"
        :label-attributes="getLabelAttributes('upstream.body.custom')"
        @change="handleCustomChange('body', $event)"
      />
    </ObjectField>

    <StringField
      v-model="formData.upstream.by_lua"
      autosize
      class="rc-code"
      label="Upstream › By Lua"
      :label-attributes="getLabelAttributes('upstream.by_lua')"
      multiline
      placeholder="Enter Lua script here..."
    />
  </ObjectField>
</template>

<script setup lang="ts">
import { useFormShared } from './composables'
import KeyValueField from '../shared/KeyValueField.vue'
import ObjectField from '../shared/ObjectField.vue'
import BooleanField from '../shared/BooleanField.vue'
import StringField from '../shared/StringField.vue'

const { formData, getLabelAttributes } = useFormShared()

function handleCustomChange(type: 'headers' | 'query' | 'body', value: Record<string, string>) {
  if (Object.keys(value).length === 0) {
    delete formData.upstream[type].custom
    return
  }
  formData.upstream[type].custom = value
}
</script>
