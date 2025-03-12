<template>
  <ObjectField
    label="Response"
    :label-attributes="getLabelAttributes('callouts.*.response')"
    required
  >
    <ObjectField
      label="Response › Headers"
      :label-attributes="getLabelAttributes('callouts.*.response.headers')"
      @update:added="setHeaders"
    >
      <BooleanField
        label="Response › Headers › Store"
        :label-attributes="getLabelAttributes('callouts.*.response.headers.store')"
        :model-value="formData.callouts?.[calloutIndex].response.headers?.store ?? false"
        @update:model-value="formData.callouts![calloutIndex]!.response.headers!.store = $event"
      />
    </ObjectField>
    <ObjectField
      label="Response › Body"
      :label-attributes="getLabelAttributes('callouts.*.response.body')"
      @update:added="setBody"
    >
      <BooleanField
        label="Response › Body › Store"
        :label-attributes="getLabelAttributes('callouts.*.response.body.store')"
        :model-value="formData.callouts?.[calloutIndex].response.body?.store ?? false"
        @update:model-value="formData.callouts![calloutIndex]!.response.body!.store = $event"
      />
      <BooleanField
        label="Response › Body › Decode"
        :label-attributes="getLabelAttributes('callouts.*.response.body.decode')"
        :model-value="formData.callouts?.[calloutIndex].response.body?.decode ?? false"
        @update:model-value="formData.callouts![calloutIndex]!.response.body!.decode = $event"
      />
    </ObjectField>
    <StringField
      autosize
      class="rc-code"
      label="Response › By Lua"
      :label-attributes="getLabelAttributes('callouts.*.response.by_lua')"
      :model-value="formData.callouts?.[calloutIndex].response.by_lua ?? ''"
      multiline
      placeholder="Enter Lua script here..."
      @update:model-value="formData.callouts![calloutIndex]!.response.by_lua = $event"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import BooleanField from '../shared/BooleanField.vue'
import ObjectField from '../shared/ObjectField.vue'
import StringField from '../shared/StringField.vue'
import { useFormShared } from './composables'
import { getDefaultCalloutResponseBody, getDefaultCalloutResponseHeaders } from './utils'

const props = defineProps<{
  calloutIndex: number;
}>()

const { formData, getLabelAttributes } = useFormShared()

function setHeaders(value: boolean) {
  const response = formData.callouts?.[props.calloutIndex]?.response
  if (response == null) {
    return
  }

  if (value) {
    response.headers = getDefaultCalloutResponseHeaders()
  } else {
    delete response.headers
  }
}

function setBody(value: boolean) {
  const response = formData.callouts?.[props.calloutIndex]?.response
  if (response == null) {
    return
  }

  if (value) {
    response.body = getDefaultCalloutResponseBody()
  } else {
    delete response.body
  }
}
</script>
