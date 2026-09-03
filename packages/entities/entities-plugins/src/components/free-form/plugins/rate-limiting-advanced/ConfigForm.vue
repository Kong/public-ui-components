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
    <ExpressionField
      v-if="getSchema('config.custom_key')"
      name="custom_key"
      :placeholder="t('sp.custom_key.expression_placeholder')"
    >
      <template #help>
        <i18nT keypath="sp.custom_key.expression_help.text">
          <template #link>
            <KExternalLink
              hide-icon
              :href="externalLinks.condition"
            >
              {{ t('sp.custom_key.expression_help.learn') }}
            </KExternalLink>
          </template>
        </i18nT>
      </template>
    </ExpressionField>
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
import { KExternalLink } from '@kong/kongponents'
import Field from '../../shared/Field.vue'
import ExpressionField from '../../shared/ExpressionField.vue'
import externalLinks from '../../../../external-links'
import useI18n from '../../../../composables/useI18n'
import EnumField from '../../shared/EnumField.vue'
import ObjectField from '../../shared/ObjectField.vue'
import AdvancedFields from '../../shared/AdvancedFields.vue'
import RequestLimitsForm from './RequestLimitsForm.vue'
import ErrorMessageForm from './ErrorMessageForm.vue'
import RedisField from './RedisField.vue'
import { useFormShared } from '../../shared/composables'

const { i18n: { t }, i18nT } = useI18n()
const { getSchema } = useFormShared()
</script>
