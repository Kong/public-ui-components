<template>
  <Form
    :schema="ServiceRequestSchema"
    @change="console.log"
  >
    <InputsField />
  </Form>
</template>

<script setup lang="ts">
import Form from '@freeform/Form.vue'
import InputsField from './InputsField.vue'
import { ServiceRequestSchema } from './schemas'
</script>

