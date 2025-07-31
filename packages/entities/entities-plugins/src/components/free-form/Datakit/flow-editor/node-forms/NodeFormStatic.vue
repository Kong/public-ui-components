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
import Form from '@freeform/Form.vue'
import Field from '@freeform/Field.vue'
import OutputValueField from './OutputValueField.vue'
import { StaticNodeSchema } from './schemas'
</script>
