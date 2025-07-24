<template>
  <EnumField
    v-if="getSchema('input')"
    :items="[]"
    label="Inputs"
    name="input"
    placeholder="Select output(s)"
  />

  <InputRecordField v-if="inputsSchema && inputsSchema.type === 'record'" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

import { useFormShared } from '../../..//shared/composables'
import EnumField from '../../../shared/EnumField.vue'
import InputRecordField from './InputsRecordField.vue'

const { getSchema } = useFormShared()

const inputsSchema = computed(() => getSchema('inputs'))
</script>
