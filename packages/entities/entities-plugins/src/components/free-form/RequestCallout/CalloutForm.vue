<template>
  <ObjectField :name="fieldName">
    <template #depends_on="dependsOnProps">
      <EnumField
        v-bind="dependsOnProps"
        :items="dependsOnItems"
        multiple
        :required="false"
      />
    </template>

    <template #request="requestProps">
      <ObjectField
        v-bind="requestProps"
        :fields-order="['url', 'method', 'headers', 'query', 'body', 'http_opts', 'error', 'by_lua']"
      >
        <template #method="methodProps">
          <EnumField
            v-bind="methodProps"
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
  </ObjectField>
</template>

<script setup lang="ts">
import { computed, watch } from 'vue'

import { toSelectItems } from '../shared/utils'
import { useFreeformStore } from '../shared/composables'
import EnumField from '../shared/EnumField.vue'
import ObjectField from '../shared/ObjectField.vue'

import { CalloutId, type RequestCalloutPlugin } from './types'
import type { SelectItem } from '@kong/kongponents'

const props = defineProps<{
  index: number
  fieldName: string
}>()

const { formData } = useFreeformStore<RequestCalloutPlugin>()

const dependableCallouts = computed(() => {
  const { callouts } = formData.config!
  if (callouts == null) {
    return []
  }

  return callouts
    .filter(({ name }) => name && name !== callouts[props.index]?.name)
})

const dependsOnItems = computed<SelectItem[]>(() => {
  return dependableCallouts.value.map(({ [CalloutId]: id, name }) => ({ value: id as string, label: name }))
})

const callout = computed(() => formData.config!.callouts[props.index])

// remove depends_on values that are not in the dependsOnItems
// try to mutate the array instead of replacing it
watch(dependsOnItems, () => {
  callout.value.depends_on = callout.value.depends_on.filter((name) =>
    dependsOnItems.value.some((item) => item.value === name),
  )
})

</script>
