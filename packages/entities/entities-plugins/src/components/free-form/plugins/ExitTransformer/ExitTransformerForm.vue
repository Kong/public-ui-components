<template>
  <StandardLayout v-bind="props">
    <template #field-renderers>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.functions'"
      >
        <ArrayField v-bind="slotProps">
          <template #item="{ fieldName }">
            <StringField
              multiline
              :name="fieldName"
              :rows="3"
            />
          </template>
        </ArrayField>
      </FieldRenderer>
    </template>

    <ConfigForm />
  </StandardLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import { provide } from 'vue'
import ConfigForm from '../../Common/ConfigForm.vue'
import StandardLayout from '../../shared/layout/StandardLayout.vue'
import FieldRenderer from '../../shared/FieldRenderer.vue'
import ArrayField from '../../shared/ArrayField.vue'
import StringField from '../../shared/StringField.vue'
import type { Props } from '../../shared/layout/StandardLayout.vue'

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])
</script>
