<template>
  <StringField
    data-1p-ignore
    data-autofocus
    label="Name"
    :label-attributes="getLabelAttributes('callouts.*.name')"
    :model-value="callout.name"
    required
    @update:model-value="val => callout.name = val ?? ''"
  />

  <EnumField
    :items="definedCalloutNames"
    label="Depends On"
    :label-attributes="getLabelAttributes('callouts.*.depends_on')"
    :model-value="callout.depends_on"
    multiple
    required
    @update:model-value="val => callout.depends_on = val ?? []"
  />

  <CalloutRequestForm :callout-index="index" />

  <CalloutResponseForm :callout-index="index" />

  <ObjectField
    label="Cache"
    :label-attributes="getLabelAttributes('callouts.*.cache')"
    required
  >
    <BooleanField
      v-model="callout.cache.bypass"
      label="Cache › Bypass"
      :label-attributes="getLabelAttributes('callouts.*.cache.bypass')"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormShared } from '../shared/composables'
import CalloutRequestForm from './CalloutRequestForm.vue'
import ObjectField from '../shared/ObjectField.vue'
import CalloutResponseForm from './CalloutResponseForm.vue'
import StringField from '../shared/StringField.vue'
import BooleanField from '../shared/BooleanField.vue'
import EnumField from '../shared/EnumField.vue'
import type { RequestCallout } from './types'

const props = defineProps<{
  index: number;
}>()

const { formData, getLabelAttributes } = useFormShared<RequestCallout>()

const definedCalloutNames = computed(() => {
  const { callouts } = formData
  if (callouts == null) {
    return []
  }

  return callouts
    .filter(({ name }) => name && name !== callouts[props.index]?.name)
    .map(({ name }) => ({ label: name, value: name }))
})

const callout = computed(() => formData.callouts[props.index])
</script>
