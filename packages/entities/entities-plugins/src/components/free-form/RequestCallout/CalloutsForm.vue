<template>
  <ArrayField
    appearance="tabs"
    :item-label="(callout: Callout) => callout.name || 'New callout'"
    name="callouts"
    required
    sticky-tabs
    @add="addCallout"
  >
    <template #item="{ index }">
      <CalloutForm :index="index" />
    </template>
  </ArrayField>
</template>

<script setup lang="ts">
import { getCalloutId } from './utils'
import { useFormShared } from '../shared/composables'
import CalloutForm from './CalloutForm.vue'
import { fieldsBuilder } from '../shared/fields-builder'

import { type RequestCalloutPlugin, type Callout, CalloutId } from './types'

const { ArrayField } = fieldsBuilder<RequestCalloutPlugin>().setScope('config')

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
