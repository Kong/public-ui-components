<template>
  <ArrayField
    appearance="tabs"
    :item-label="(callout: Callout) => callout.name || 'New callout'"
    name="callouts"
    required
    sticky-tabs
    @add="addCallout"
  >
    <template #item="{ index, fieldName }">
      <CalloutForm
        :field-name="fieldName"
        :index="index"
      />
    </template>
  </ArrayField>
</template>

<script setup lang="ts">
import { getCalloutId } from './utils'
import { useFormShared } from '../shared/composables'
import ArrayField from '../shared/ArrayField.vue'
import CalloutForm from './CalloutForm.vue'

import { type RequestCalloutPlugin, type Callout, CalloutId } from './types'

const { formData, getDefault } = useFormShared<RequestCalloutPlugin>()

function addCallout() {
  const callout = getDefault('config.callouts.*') as Callout
  callout.request.body.custom = callout.request.body.custom ?? {}

  const latest = formData.config!.callouts[formData.config!.callouts.length - 1]

  if (latest) {
    latest[CalloutId] = getCalloutId()
  }
}
</script>
