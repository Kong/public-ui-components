<template>
  <ObjectField
    as-child
    name="config"
    reset-label-path="reset"
  >
    <Field name="identifier" />
    <RequestLimitsForm />
    <ErrorMessageForm />
  </ObjectField>

  <AdvancedFields hide-general-fields>
    <EnumField
      :multiple="true"
      name="config.compound_identifier"
    />
    <Field name="config.cost_strategy" />
    <Field name="config.max_cost" />
    <Field name="config.score_factor" />
    <Field
      v-if="getSchema('config.counter_key')"
      name="config.counter_key"
    />
    <Field name="config.sync_rate" />
    <Field name="config.namespace" />
    <Field name="config.strategy" />
    <RedisField />
    <Field name="config.dictionary_name" />
    <Field name="config.lock_dictionary_name" />
    <Field name="config.hide_client_headers" />
    <Field name="config.retry_after_jitter_max" />
    <Field name="config.header_name" />
    <Field name="config.path" />
    <Field name="config.throttling" />
    <Field name="config.enforce_consumer_groups" />
    <Field name="config.consumer_groups" />
    <Field name="config.disable_penalty" />
  </AdvancedFields>
</template>

<script setup lang="ts">
import Field from '../../shared/Field.vue'
import EnumField from '../../shared/EnumField.vue'
import ObjectField from '../../shared/ObjectField.vue'
import AdvancedFields from '../../shared/AdvancedFields.vue'
import RequestLimitsForm from '../rate-limiting-advanced/RequestLimitsForm.vue'
import ErrorMessageForm from '../rate-limiting-advanced/ErrorMessageForm.vue'
import RedisField from './RedisField.vue'
import { useFormShared } from '../../shared/composables'

const { getSchema } = useFormShared()
</script>
