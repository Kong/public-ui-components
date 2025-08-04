<template>
  <Form
    ref="form"
    :config="{ updateOnChange: true }"
    :data="formData"
    :schema="CallNodeSchema"
    @change="console.log"
  >
    <StringField
      name="name"
      @update:model-value="updateName"
    />

    <KLabel class="dk-node-configuration-label">
      {{ i18n.t('plugins.free-form.datakit.flow_editor.node_properties.Configuration') }}
    </KLabel>

    <StringField
      name="url"
      @update:model-value="updateConfiguration"
    />

    <HttpMethodField
      name="method"
      @update:model-value="updateConfiguration"
    />

    <NumberField
      :label="i18n.t('plugins.free-form.datakit.flow_editor.node_properties.timeout.label')"
      name="timeout"
      @update:model-value="updateConfiguration"
    />

    <StringField
      name="ssl_server_name"
      @update:model-value="updateConfiguration"
    />

    <InputsField
      :items="inputOptions"
      @update:input="updateInput"
      @update:inputs="updateInputs"
    />
  </Form>
</template>

<script setup lang="ts">
import Form from '../../../shared/Form.vue'
import HttpMethodField from './HttpMethodField.vue'
import InputsField from './InputsField.vue'
import { CallNodeSchema } from '../node/mock'
import useI18n from '../../../../../composables/useI18n'
import NumberField from '../../../shared/NumberField.vue'
import { useNodeFormState } from './composables'
import StringField from '../../../shared/StringField.vue'
import { useTemplateRef } from 'vue'

const { i18n } = useI18n()

const formRef = useTemplateRef('form')

const {
  formData,
  updateName,
  updateConfiguration,
  inputOptions,
  updateInputs,
  updateInput,
} = useNodeFormState(() => formRef.value!.getInnerData())
</script>

