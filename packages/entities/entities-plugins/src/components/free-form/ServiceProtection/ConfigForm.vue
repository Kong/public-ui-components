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
    <Field name="config.dictionary_name" />
    <Field name="config.lock_dictionary_name" />
    <Field name="config.strategy" />
    <RedisField />
    <Field name="config.namespace" />
    <Field name="config.hide_client_headers" />
    <Field name="config.disable_penalty" />
    <Field name="config.retry_after_jitter_max" />
    <Field name="config.sync_rate" />
  </AdvancedFields>
</template>

<script setup lang="ts">
import Field from '../shared/Field.vue'
import ObjectField from '../shared/ObjectField.vue'
import RequestLimitsForm from './RequestLimitsForm.vue'
import ErrorMessageForm from './ErrorMessageForm.vue'
import AdvancedFields from '../shared/AdvancedFields.vue'
import RedisField from './RedisField.vue'
</script>
