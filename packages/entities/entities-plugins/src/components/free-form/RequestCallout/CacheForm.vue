<template>
  <ObjectField
    appearance="card"
    label="Cache"
    :label-attributes="getLabelAttributes('cache')"
    required
  >
    <EnumField
      v-model="formData.cache.strategy"
      clearable
      :items="CACHE_STRATEGIES"
      label="Cache › Strategy"
      :label-attributes="getLabelAttributes('cache.strategy')"
    />

    <ObjectField
      label="Cache › Memory"
      :label-attributes="getLabelAttributes('cache.memory')"
      required
    >
      <StringField
        v-model="formData.cache.memory.dictionary_name"
        label="Cache › Memory › Dictionary Name"
        :label-attributes="getLabelAttributes('cache.memory.dictionary_name')"
        required
      />
    </ObjectField>

    <RedisForm />

    <NumberField
      v-model="formData.cache.cache_ttl"
      label="Cache › Cache TTL"
      :label-attributes="getLabelAttributes('cache.cache_ttl')"
      min="1"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import { useFormShared } from './composables'
import ObjectField from '../shared/ObjectField.vue'
import RedisForm from './RedisForm.vue'
import { toSelectItems } from './utils'
import StringField from '../shared/StringField.vue'
import EnumField from '../shared/EnumField.vue'
import NumberField from '../shared/NumberField.vue'

const { formData, getLabelAttributes } = useFormShared()

const CACHE_STRATEGIES = toSelectItems([
  'memory',
  'disk',
])
</script>
