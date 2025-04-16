<template>
  <ObjectField :name="name">
    <template #depends_on="props">
      <EnumField
        v-bind="props"
        :items="dependsOnItems"
        multiple
        :required="false"
      />
    </template>

    <template #[`request.method`]="props">
      <EnumField
        v-bind="props"
        :items="toSelectItems([
          'GET',
          'POST',
          'PUT',
          'DELETE',
          'PATCH',
          'HEAD',
          'OPTIONS',
          'CONNECT',
          'TRACE',
        ])"
      />
    </template>
  </ObjectField>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

import { toSelectItems } from '../shared/utils'
import { useFormShared } from '../shared/composables'
import EnumField from '../shared/EnumField.vue'
import ObjectField from '../shared/ObjectField.vue'

import type { RequestCallout } from './types'
import type { SelectItem } from '@kong/kongponents'

const props = defineProps<{
  index: number
  name: string
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
