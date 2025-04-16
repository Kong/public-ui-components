<template>
  <ObjectField
    appearance="card"
    hide-required-asterisk
    name="cache"
    required
  >
    <EnumField
      label="Cache › Strategy"
      name="strategy"
    />

    <ObjectField
      hide-required-asterisk
      label="Cache › Memory"
      name="memory"
      required
    >
      <StringField
        label="Cache › Memory › Dictionary Name"
        name="dictionary_name"
      />
    </ObjectField>

    <RedisForm />

    <NumberField
      label="Cache › Cache TTL"
      min="1"
      name="cache_ttl"
    />
  </ObjectField>
</template>

<script setup lang="ts">
import ObjectField from '../shared/ObjectField.vue'
import RedisForm from './RedisForm.vue'
import StringField from '../shared/StringField.vue'
import EnumField from '../shared/EnumField.vue'
import NumberField from '../shared/NumberField.vue'
</script>
