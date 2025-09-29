<template>
  <Form
    ref="form"
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

    <div
      v-for="logical in logicalOutputs"
      :key="logical.key"
      class="dk-branch-node-section"
    >
      <div class="dk-branch-node-section__header">
        <KLabel>
          {{ logical.label }}
        </KLabel>
        <p class="dk-branch-node-section__help">
          {{ logical.help }}
        </p>
      </div>

      <KMultiselect
        :items="targetOptions"
        :model-value="selections[logical.key] ?? []"
        :placeholder="t('plugins.free-form.datakit.flow_editor.node_properties.branch.placeholder')"
        width="100%"
        @update:model-value="value => updateLogical(logical.key, value as string[])"
      />
    </div>
  </Form>
</template>

<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useTemplateRef } from 'vue'

import Form from '../../../shared/Form.vue'
import NameField from './NameField.vue'
import { KLabel, KMultiselect } from '@kong/kongponents'
import useI18n from '../../../../../composables/useI18n'
import { useNodeForm, useSubSchema, type BaseFormData } from '../composables/useNodeForm'
import type { BranchKey, NodeName, NodeId } from '../../types'
import type { MultiselectItem } from '@kong/kongponents'
import { useEditorStore } from '../../composables'
import { isImplicitType } from '../node/node'
import { getBranchesFromMeta } from '../store/helpers'

interface BranchFormData extends BaseFormData {
  then?: NodeName[]
  else?: NodeName[]
}

const { nodeId } = defineProps<{ nodeId: NodeId }>()

const { i18n: { t } } = useI18n()

const formRef = useTemplateRef('form')

const selections = reactive<Partial<Record<BranchKey, NodeName[]>>>({})

const schema = useSubSchema('branch')

const getInnerData = () => {
  const inner = formRef.value?.getInnerData?.() ?? {}
  return {
    ...inner,
    ...Object.fromEntries(Object.entries(selections).map(([key, value]) => [key, [...value]])),
  }
}

const {
  formData,
  setName,
  setConfig,
  nameValidator,
} = useNodeForm<BranchFormData>(nodeId, getInnerData)

const { state, getNodeById } = useEditorStore()

const currentNode = computed(() => getNodeById(nodeId))
</script>

<style scoped lang="scss">
.dk-branch-node-section {
  display: flex;
  flex-direction: column;
  gap: $kui-space-30;
}
</style>
