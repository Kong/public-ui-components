<template>
  <ArrayField
    appearance="tabs"
    :item-label="(callout: Callout) => callout.name || 'New callout'"
    item-label-field="name"
    name="callouts"
    required
    sticky-tabs
    @add="addCallout"
  >
    <template #item="{ index }">
      <ObjectField
        child-only
        :name="String(index)"
      >
        <CalloutForm :index="index" />
      </ObjectField>
    </template>
  </ArrayField>
</template>

<script setup lang="ts">
import ArrayField from '../shared/ArrayField.vue'
import { useFormShared } from '../shared/composables'
import CalloutForm from './CalloutForm.vue'
import type { RequestCallout, Callout } from './types'
import { getCalloutId } from './utils'
import ObjectField from '../shared/ObjectField.vue'

const { formData, getDefault } = useFormShared<RequestCallout>()

function addCallout() {
  const callout = getDefault('callouts.*') as Callout
  callout.request.body.custom = callout.request.body.custom ?? {}

  const latest = formData.callouts[formData.callouts.length - 1]

  if (latest) {
    latest._id = getCalloutId()
  }
}
</script>
