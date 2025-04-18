<template>
  <StringField
    data-1p-ignore
    data-autofocus
    name="name"
  />

  <EnumField
    :items="dependsOnItems"
    multiple
    name="depends_on"
    :required="false"
  />

  <CalloutRequestForm />

  <CalloutResponseForm />

  <ObjectField name="cache">
    <BooleanField
      label="Cache › Bypass"
      name="bypass"
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
import EnumField from '../shared/EnumField.vue'
import type { RequestCallout } from './types'
import type { SelectItem } from '@kong/kongponents'
import BooleanField from '../shared/BooleanField.vue'

const props = defineProps<{
  index: number;
}>()

const { formData } = useFormShared<RequestCallout>()

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
