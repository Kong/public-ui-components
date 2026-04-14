import MeteringAndBillingForm from './MeteringAndBillingForm.vue'
import BooleanField from '../../shared/BooleanField.vue'
import EnumField from '../../shared/EnumField.vue'
import NumberField from '../../shared/NumberField.vue'
import ArrayField from '../../shared/ArrayField.vue'
import StringField from '../../shared/StringField.vue'
import { definePluginConfig } from '../../shared/define-plugin-config'
import useI18n from '../../../../composables/useI18n'
import type { Component } from 'vue'

const { i18n: { t } } = useI18n()

export default definePluginConfig({
  experimental: true,
  component: MeteringAndBillingForm,
  fieldRenderers: [
    {
      match: ({ path }) => path === 'config.meter_api_requests',
      component: BooleanField,
      propsOverrides: { description: t('plugins.free-form.metering-and-billing.fields.meter_api_requests.description') },
    },
    {
      match: ({ path }) => path === 'config.meter_ai_token_usage',
      component: BooleanField,
      propsOverrides: { description: t('plugins.free-form.metering-and-billing.fields.meter_ai_token_usage.description') },
    },
    {
      match: ({ path }) => path === 'config.ssl_verify',
      component: BooleanField,
      propsOverrides: {
        description: t('plugins.free-form.metering-and-billing.fields.ssl_verify.description'),
        label: t('plugins.free-form.metering-and-billing.fields.ssl_verify.label'),
      },
    },
    {
      match: ({ path }) => path === 'config.subject.look_up_value_in',
      component: EnumField,
      propsOverrides: {
        help: t('plugins.free-form.metering-and-billing.fields.look_up_value_in.help'),
        label: t('plugins.free-form.metering-and-billing.fields.look_up_value_in.label'),
      },
    },
    {
      match: ({ path }) => path === 'config.subject.field',
      component: StringField,
      propsOverrides: {
        help: t('plugins.free-form.metering-and-billing.fields.subject_field.help'),
        label: t('plugins.free-form.metering-and-billing.fields.subject_field.label'),
        placeholder: t('plugins.free-form.metering-and-billing.fields.subject_field.placeholder'),
      },
    },
    {
      match: ({ path }) => path === 'config.timeout',
      component: NumberField,
      propsOverrides: { label: t('plugins.free-form.metering-and-billing.fields.timeout.label') },
    },
    {
      match: ({ path }) => path === 'config.keepalive',
      component: NumberField,
      propsOverrides: { label: t('plugins.free-form.metering-and-billing.fields.keepalive.label') },
    },
    {
      match: ({ path }) => path === 'config.queue.max_coalescing_delay',
      component: NumberField,
      propsOverrides: { label: t('plugins.free-form.metering-and-billing.fields.queue.max_coalescing_delay.label') },
    },
    {
      match: ({ path }) => path === 'config.queue.initial_retry_delay',
      component: NumberField,
      propsOverrides: { label: t('plugins.free-form.metering-and-billing.fields.queue.initial_retry_delay.label') },
    },
    {
      match: ({ path }) => path === 'config.queue.max_retry_delay',
      component: NumberField,
      propsOverrides: { label: t('plugins.free-form.metering-and-billing.fields.queue.max_retry_delay.label') },
    },
    {
      match: ({ path }) => path === 'config.queue.max_retry_time',
      component: NumberField,
      propsOverrides: { label: t('plugins.free-form.metering-and-billing.fields.queue.max_retry_time.label') },
    },
    {
      match: ({ path }) => path === 'config.attributes',
      component: ArrayField as Component,
      propsOverrides: {
        collapsible: true,
        label: t('plugins.free-form.metering-and-billing.fields.attributes.title'),
      },
    },
    {
      match: ({ path }) => path.startsWith('config.attributes.') && path.endsWith('.look_up_value_in'),
      component: StringField,
      propsOverrides: { placeholder: t('plugins.free-form.metering-and-billing.fields.attributes.look_up_value_in.placeholder') },
    },
    {
      match: ({ path }) => path.startsWith('config.attributes.') && path.endsWith('.event_property_name'),
      component: StringField,
      propsOverrides: { placeholder: t('plugins.free-form.metering-and-billing.fields.attributes.event_property_name.placeholder') },
    },
  ],
})

