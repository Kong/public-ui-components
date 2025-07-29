<template>
  <Form
    :schema="JqNodeSchema"
    @change="console.log"
  >
    <Field name="name" />

    <KLabel class="dk-node-configuration-label">
      {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.Configuration') }}
    </KLabel>

    <StringField
      :label="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.jq.label')"
      multiline
      name="jq"
      resizable
      rows="2"
    />
    <InputsField />

    <!-- Todo(zehao): outputs definition fields -->
  </Form>
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import Field from '../../../shared/Field.vue'
import InputsField from '../fields/InputsField.vue'
import { JqNodeSchema } from './mock'
import useI18n from '../../../../../composables/useI18n'
import StringField from '../../../shared/StringField.vue'

const { i18n } = useI18n()
</script>
