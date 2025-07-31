<template>
  <Form
    :schema="CallNodeSchema"
    @change="console.log"
  >
    <Field name="name" />

    <KLabel class="dk-node-configuration-label">
      {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.Configuration') }}
    </KLabel>

    <Field name="url" />
    <HttpMethodField name="method" />
    <NumberField
      :label="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.timeout.label')"
      name="timeout"
    />
    <Field name="ssl_server_name" />
    <InputsField />
  </Form>
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import Field from '../../../shared/Field.vue'
import HttpMethodField from './HttpMethodField.vue'
import InputsField from './InputsField.vue'
import { CallNodeSchema } from '../node/mock'
import useI18n from '../../../../../composables/useI18n'
import NumberField from '../../../shared/NumberField.vue'

const { i18n } = useI18n()
</script>

