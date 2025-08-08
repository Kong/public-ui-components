<template>
  <Form
    ref="form"
    :config="{ updateOnChange: true }"
    :data="formData"
    :schema="CallNodeSchema"
  >
    <StringField
      name="name"
      @update:model-value="setName"
    />

    <KLabel class="dk-node-configuration-label">
      {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.Configuration') }}
    </KLabel>

    <StringField
      name="url"
      @update:model-value="setConfig()"
    />

    <HttpMethodField
      name="method"
      @update:model-value="setConfig()"
    />

    <NumberField
      :label="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.timeout.label')"
      name="timeout"
      @update:model-value="setConfig()"
    />

    <StringField
      name="ssl_server_name"
      @update:model-value="setConfig()"
    />

    <InputsField
      :items="inputOptions"
      @change:input="setInput"
      @change:inputs="setInputs"
    />
  </Form>
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import HttpMethodField from './HttpMethodField.vue'
import InputsField from './InputsField.vue'
import { CallNodeSchema } from '../node/schemas'
import useI18n from '../../../../../composables/useI18n'
import NumberField from '../../../shared/NumberField.vue'
import { useNodeForm } from './composables'
import StringField from '../../../shared/StringField.vue'
import { useTemplateRef } from 'vue'

const { i18n } = useI18n()

const formRef = useTemplateRef('form')

const {
  formData,
  setName,
  setConfig,
  inputOptions,
  setInputs,
  setInput,
} = useNodeForm(() => formRef.value!.getInnerData())
</script>

