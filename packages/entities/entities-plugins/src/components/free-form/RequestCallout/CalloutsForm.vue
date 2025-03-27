<template>
  <ArrayField
    appearance="tabs"
    :item-label="(callout: Callout) => callout.name || 'New callout'"
    item-label-field="name"
    :items="formData.callouts"
    label="Callouts"
    :label-attributes="getLabelAttributes('callouts')"
    required
    sticky-tabs
    @add="addCallout"
    @remove="removeCallout"
  >
    <template #item="{ index }">
      <CalloutForm :index="index" />
    </template>
  </ArrayField>
</template>

<script setup lang="ts">
import { useFormShared } from '../shared/composables'
import ArrayField from '../shared/ArrayField.vue'
import CalloutForm from './CalloutForm.vue'
import type { RequestCallout, Callout } from './types'
import { getCalloutId } from './utils'

const { formData, getLabelAttributes, getDefault } = useFormShared<RequestCallout>()

function addCallout() {
  if (!formData.callouts) {
    formData.callouts = []
  }

  const callout = getDefault('callouts.*') as Callout
  callout.request.body.custom = callout.request.body.custom ?? {}

  formData.callouts.push({
    _id: getCalloutId(),
    ...callout,
  })
}

function removeCallout(index: number) {
  formData.callouts.splice(index, 1)
}
</script>
