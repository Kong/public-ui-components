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
    <EnumField
      :multiple="true"
      name="config.compound_identifier"
    />
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
import Field from '../../core/components/Field.vue'
import EnumField from '../../core/components/EnumField.vue'
import ObjectField from '../../core/components/ObjectField.vue'
import AdvancedFields from '../../components/AdvancedFields.vue'
import RequestLimitsForm from './RequestLimitsForm.vue'
import ErrorMessageForm from './ErrorMessageForm.vue'
import RedisField from './RedisField.vue'
import { useFormShared } from '../../core/composables'

const { getSchema } = useFormShared()
</script>
