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

const { formData, setFormData } = useFreeformStore<RequestCalloutPlugin>()

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

// remove depends_on values that are not in the dependsOnItems
watch(dependsOnItems, () => {
  setFormData({
    ...formData,
    config: {
      ...formData.config,
      callouts: formData.config!.callouts.map((c, i) => {
        if (i !== props.index) return c
        return {
          ...c,
          depends_on: c.depends_on?.filter((name) =>
            dependsOnItems.value.some((item) => item.value === name),
          ),
        }
      }),
    },
  })
})

</script>
