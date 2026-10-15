<template>
  <ObjectField
    as-child
    name="config"
    reset-label-path="reset"
  >
    <!--
      Overrides the key `identifier` computes, so it leads. Added by a newer
      Gateway alongside the `expressions` record, hence the guard.
    -->
    <Field
      v-if="getSchema('config.custom_key')"
      name="custom_key"
    />
    <Field name="identifier" />
    <RequestLimitsForm />
    <ErrorMessageForm />
  </ObjectField>

  <AdvancedFields hide-general-fields>
    <ObjectField
      as-child
      name="config"
      :omit="PRIMARY_FIELDS"
      reset-label-path="reset"
    />
  </AdvancedFields>
</template>

<script setup lang="ts">
import { Field, ObjectField, useFormShared } from '@kong-ui-public/freeform'
import AdvancedFields from '../../components/AdvancedFields.vue'
import RequestLimitsForm from './RequestLimitsForm.vue'
import ErrorMessageForm from './ErrorMessageForm.vue'

/**
 * Fields rendered by hand in the section above, kept out of Advanced.
 */
const PRIMARY_FIELDS = [
  'custom_key',
  'identifier',
  // RequestLimitsForm
  'limit',
  'window_size',
  'window_type',
  // ErrorMessageForm
  'error_code',
  'error_message',
]

const { getSchema } = useFormShared()
</script>
