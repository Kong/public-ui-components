<template>
  <StringField
    data-1p-ignore
    data-autofocus
    label="Name"
    :label-attributes="getLabelAttributes('callouts.*.name')"
    :model-value="callout.name"
    :placeholder="getPlaceholder('callouts.*.name')"
    required
    @update:model-value="val => callout.name = val ?? ''"
  />

  <EnumField
    :items="dependsOnItems"
    label="Depends On"
    :label-attributes="getLabelAttributes('callouts.*.depends_on')"
    :model-value="callout.depends_on"
    multiple
    :placeholder="getPlaceholder('callouts.*.depends_on')"
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
import { computed, watch } from 'vue'
import { useFormShared } from '../shared/composables'
import CalloutRequestForm from './CalloutRequestForm.vue'
import ObjectField from '../shared/ObjectField.vue'
import CalloutResponseForm from './CalloutResponseForm.vue'
import StringField from '../shared/StringField.vue'
import BooleanField from '../shared/BooleanField.vue'
import EnumField from '../shared/EnumField.vue'
import type { RequestCallout } from './types'
import type { SelectItem } from '@kong/kongponents'

const props = defineProps<{
  index: number;
}>()

const { formData, getLabelAttributes, getPlaceholder } = useFormShared<RequestCallout>()

const dependableCallouts = computed(() => {
  const { callouts } = formData
  if (callouts == null) {
    return []
  }

  return callouts
    .filter(({ name }) => name && name !== callouts[props.index]?.name)
})

const dependsOnItems = computed<SelectItem[]>(() => {
  return dependableCallouts.value.map(({ _id, name }) => ({ value: _id as string, label: name }))
})

const callout = computed(() => formData.callouts[props.index])

// remove depends_on values that are not in the dependsOnItems
// try to mutate the array instead of replacing it
watch(dependsOnItems, () => {
  callout.value.depends_on = callout.value.depends_on.filter((name) =>
    dependsOnItems.value.some((item) => item.value === name),
  )
})

</script>
