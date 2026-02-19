<script setup lang="ts">
import Form from '../../shared/Form.vue'
import ArrayField from '../../shared/ArrayField.vue'
import FieldRenderer from '../../shared/FieldRenderer.vue'
import { FIELD_RENDERERS } from '../../shared/composables'
import type { FormSchema } from '../../../../types/plugins/form-schema'

defineProps<{
  schema: FormSchema
  /** Field names that should render as tabs appearance */
  tabFields: string[]
}>()
</script>

<template>
  <div style="padding: 20px">
    <Form
      :schema="schema"
      tag="div"
    >
      <template #[FIELD_RENDERERS]>
        <FieldRenderer
          v-for="fieldName in tabFields"
          :key="fieldName"
          v-slot="props"
          :match="({ path }) => path.endsWith(fieldName)"
        >
          <ArrayField
            v-bind="props"
            appearance="tabs"
          />
        </FieldRenderer>
      </template>
    </Form>
  </div>
</template>
