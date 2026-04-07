<script setup lang="ts">
import Form from '../../shared/Form.vue'
import FieldRenderer from '../../shared/FieldRenderer.vue'
import type { FormSchema } from '../../../../types/plugins/form-schema'
import MapField from '../../shared/MapField.vue'

const props = defineProps<{
  schema: FormSchema
  fieldName: string
}>()
</script>

<template>
  <div style="padding: 20px">
    <Form :schema="schema">
      <template #free-form-field-renderers-slot>
        <FieldRenderer :match="({ path }) => path === props.fieldName">
          <template #default="slotProps">
            <MapField
              v-bind="slotProps"
              :appearance="{ string: { multiline: true } }"
            />
          </template>
        </FieldRenderer>
      </template>
    </Form>
  </div>
</template>
