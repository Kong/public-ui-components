<template>
  <ArrayField
    appearance="tabs"
    :item-label="(callout: Callout) => callout.name || 'New callout'"
    item-label-field="name"
    :items="formData.callouts"
    label="Callouts"
    :label-attributes="getLabelAttributes('callouts')"
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
import { useFormShared } from './composables'
import ArrayField from '../shared/ArrayField.vue'
import CalloutForm from './CalloutForm.vue'
import { getDefaultCallout } from './utils'
import type { Callout } from './types'

const { formData, getLabelAttributes } = useFormShared()

function addCallout() {
  if (!formData.callouts) {
    formData.callouts = []
  }
  formData.callouts.push(getDefaultCallout())
}

function removeCallout(index: number) {
  if (formData.callouts == null) {
    return
  }
  formData.callouts.splice(index, 1)
  if (formData.callouts.length === 0) {
    delete formData.callouts
  }
}
</script>
