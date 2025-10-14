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
import { useFreeformStore } from '../shared/composables'
import ArrayField from '../shared/ArrayField.vue'
import CalloutForm from './CalloutForm.vue'

import { type RequestCalloutPlugin, type Callout, CalloutId } from './types'

const { formData } = useFreeformStore<RequestCalloutPlugin>()

function addCallout() {
  const latest = formData.config!.callouts[formData.config!.callouts.length - 1]

  if (latest) {
    latest[CalloutId] = getCalloutId()
  }
}
</script>
