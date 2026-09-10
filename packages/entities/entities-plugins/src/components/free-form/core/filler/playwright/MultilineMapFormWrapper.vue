<script setup lang="ts">
import Form from '../../components/Form.vue'
import FieldRenderer from '../../components/FieldRenderer.vue'
import type { FormSchema } from '../../form-schema'
import MapField from '../../components/MapField.vue'

const props = defineProps<{
  schema: FormSchema
  fieldName: string
}>()
</script>

<template>
  <div class="multiline-form-wrapper">
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

<style lang="scss" scoped>
.multiline-form-wrapper {
  padding: 20px;
}
</style>
