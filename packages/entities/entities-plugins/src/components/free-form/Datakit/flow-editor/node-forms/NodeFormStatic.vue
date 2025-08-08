<template>
  <Form
    :schema="StaticNodeSchema"
    @change="console.log"
  >
    <Field name="name" />

    <OutputValueField name="values" />
  </Form>
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import Field from '../../../shared/Field.vue'
import OutputValueField from './OutputValueField.vue'
import { StaticNodeSchema } from '../node/mock'
</script>
