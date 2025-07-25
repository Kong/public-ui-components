<template>
  <Form
    :schema="ResponseSchema"
    @change="console.log"
  >
    <InputsField />
  </Form>
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import InputsField from '../fields/InputsField.vue'
import { ResponseSchema } from './mock'
</script>

