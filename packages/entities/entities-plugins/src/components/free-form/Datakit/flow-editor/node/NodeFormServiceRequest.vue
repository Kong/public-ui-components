<template>
  <Form
    :schema="ServiceRequestSchema"
    @change="console.log"
  >
    <InputsField />
  </Form>
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import InputsField from '../fields/InputsField.vue'
import { ServiceRequestSchema } from './mock'
</script>

