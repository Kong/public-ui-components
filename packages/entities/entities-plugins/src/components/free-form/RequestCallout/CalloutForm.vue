<template>
  <StringField
    data-1p-ignore
    data-autofocus
    label="Name"
    :label-attributes="getLabelAttributes('callouts.*.name')"
    :model-value="formData.callouts?.[index]?.name"
    required
    @update:model-value="formData.callouts![index].name = $event"
  />

  <EnumField
    :items="definedCalloutNames"
    label="Depends On"
    :label-attributes="getLabelAttributes('callouts.*.depends_on')"
    :model-value="formData.callouts?.[index]?.depends_on"
    multiple
    placeholder="0 callouts selected"
    @update:model-value="formData.callouts![index].depends_on = $event"
  />

  <CalloutRequestForm :callout-index="index" />

  <CalloutResponseForm :callout-index="index" />

  <ObjectField
    label="Cache"
    :label-attributes="getLabelAttributes('callouts.*.cache')"
    @update:added="setCache"
  >
    <BooleanField
      label="Cache › Bypass"
      :label-attributes="getLabelAttributes('callouts.*.cache.bypass')"
      :model-value="formData.callouts?.[index].cache?.bypass || false"
      @update:model-value="updateBypass"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useFormShared } from './composables'
import CalloutRequestForm from './CalloutRequestForm.vue'
import ObjectField from '../shared/ObjectField.vue'
import CalloutResponseForm from './CalloutResponseForm.vue'
import { getDefaultCalloutCache } from './utils'
import StringField from '../shared/StringField.vue'
import BooleanField from '../shared/BooleanField.vue'
import EnumField from '../shared/EnumField.vue'

const props = defineProps<{
  index: number;
}>()

const { formData, getLabelAttributes } = useFormShared()

const definedCalloutNames = computed(() => {
  const { callouts } = formData
  if (callouts == null) {
    return []
  }

  return callouts
    .filter(({ name }) => name && name !== callouts[props.index]?.name)
    .map(({ name }) => ({ label: name, value: name }))
})

function setCache(value: boolean) {
  const callout = formData.callouts?.[props.index]

  if (callout == null) {
    return
  }

  if (value) {
    callout.cache = getDefaultCalloutCache()
  } else {
    delete callout.cache
  }
}

function updateBypass(value: boolean) {
  const cache = formData.callouts?.[props.index].cache
  if (cache) {
    cache.bypass = value
  }
}
</script>
