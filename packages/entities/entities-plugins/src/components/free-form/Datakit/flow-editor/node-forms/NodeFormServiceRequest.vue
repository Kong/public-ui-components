<template>
  <Form
    :schema="ServiceRequestSchema"
    @change="console.log"
  >
    <InputsField :items="[]" />
  </Form>
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import InputsField from './InputsField.vue'
import { ServiceRequestSchema } from '../node/mock'
</script>

