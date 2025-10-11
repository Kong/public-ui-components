<template>
  <Form
    :key="formRenderKey"
    :data="formData"
    :schema="schema"
  >
    <NameField
      :name="formData.name"
      :validate="nameValidator"
      @update="setName"
    />

    <KLabel class="dk-node-configuration-label">
      {{ t('plugins.free-form.datakit.flow_editor.node_properties.configuration') }}
    </KLabel>

    <EnumField
      enable-filtering
      :items="branchOptions"
      multiple
      name="then"
      @update="(value) => onBranchChange('then', value)"
    />

    <EnumField
      enable-filtering
      :items="branchOptions"
      multiple
      name="else"
      @update="(value) => onBranchChange('else', value)"
    />

    <InputsField
      :field-name-validator="fieldNameValidator"
      :field-names="inputsFieldNames"
      :items="inputOptions"
      @change:input="setInput"
      @change:inputs="setInputs"
    />
  </Form>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import Form from '../../../shared/Form.vue'
import NameField from './NameField.vue'
import InputsField from './InputsField.vue'
import { KLabel } from '@kong/kongponents'
import useI18n from '../../../../../composables/useI18n'
import { useSubSchema, type BaseFormData } from '../composables/useNodeForm'
import { useBranchNodeForm } from '../composables/useBranchNodeForm'
import type { BranchName, NodeId } from '../../types'
import EnumField from '../../../shared/EnumField.vue'

type BranchFormData = BaseFormData & Record<string, unknown>

const { nodeId } = defineProps<{ nodeId: NodeId }>()

const { i18n: { t } } = useI18n()

const schema = useSubSchema('branch')

const formRenderKey = ref(0)

const {
  formData,
  setName,
  inputOptions,
  branchOptions,
  nameValidator,
  setInput,
  setInputs,
  inputsFieldNames,
  fieldNameValidator,
  updateBranchMembers,
} = useBranchNodeForm<BranchFormData>(nodeId)

async function onBranchChange(branch: BranchName, value: string | string[] | null) {
  const success = await updateBranchMembers(branch, value)
  if (!success) {
    // force re-render to reset the select field if user canceled the change
    // on conflict (e.g. selecting the same field for both branches)
    formRenderKey.value += 1
  }
}
</script>
