<template>
  <Form
    :schema="CallNodeSchema"
    @change="console.log"
  >
    <Field name="name" />
    <Field name="url" />
    <HttpMethodField name="method" />
    <Field name="timeout" />
    <Field name="ssl_server_name" />
    <InputsField />
  </Form>
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import Field from '../../../shared/Field.vue'
import HttpMethodField from '../fields/HttpMethodField.vue'
import InputsField from '../fields/InputsField.vue'

import { CallNodeSchema } from './mock'

</script>

