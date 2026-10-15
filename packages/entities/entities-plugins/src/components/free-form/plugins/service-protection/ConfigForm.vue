<template>
  <ObjectField
    as-child
    name="config"
    reset-label-path="reset"
  >
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
import { ObjectField } from '@kong-ui-public/freeform'
import RequestLimitsForm from './RequestLimitsForm.vue'
import ErrorMessageForm from './ErrorMessageForm.vue'
import AdvancedFields from '../../components/AdvancedFields.vue'

/**
 * Fields rendered by hand in the section above, kept out of Advanced.
 */
const PRIMARY_FIELDS = [
  // RequestLimitsForm
  'limit',
  'window_size',
  'window_type',
  // ErrorMessageForm
  'error_code',
  'error_message',
]
</script>
