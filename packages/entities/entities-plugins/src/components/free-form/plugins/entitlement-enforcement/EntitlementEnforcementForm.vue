<template>
  <!-- Not configurable in Kong Manager yet — show a notice instead of the form.
       Saving is blocked via a before-save guard (BEFORE_SAVE_KEY; see script). -->
  <KAlert
    v-if="isKongManager"
    appearance="info"
    class="ff-entitlement-enforcement-unavailable"
    data-testid="ff-entitlement-enforcement-unavailable"
    :message="t('plugins.free-form.governance.unavailable_kong_manager')"
  />

  <DynamicLayout
    v-else
    v-bind="props"
    :config-sections="configSections"
    :form-config="formConfig"
  >
    <template #field-renderers>
      <!-- Customer: look_up_value_in -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.customer.look_up_value_in'"
      >
        <EnumField
          v-bind="slotProps"
          :help="t('plugins.free-form.governance.fields.look_up_value_in.help')"
          :label="t('plugins.free-form.governance.fields.look_up_value_in.label')"
        />
      </FieldRenderer>

      <!-- Customer: field -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.customer.field'"
      >
        <StringField
          v-bind="slotProps"
          :help="t('plugins.free-form.governance.fields.subject_field.help')"
          :label="t('plugins.free-form.governance.fields.subject_field.label')"
          :placeholder="t('plugins.free-form.governance.fields.subject_field.placeholder')"
        />
      </FieldRenderer>

      <!-- Connection: ssl_verify -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.ssl_verify'"
      >
        <BooleanField
          v-bind="slotProps"
          :description="t('plugins.free-form.governance.fields.ssl_verify.description')"
          :label="t('plugins.free-form.governance.fields.ssl_verify.label')"
        />
      </FieldRenderer>

      <!-- Connection: timeout -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.timeout'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.governance.fields.timeout.label')"
        />
      </FieldRenderer>

      <!-- Connection: keepalive -->
      <!-- NOTE: design-driven field, pending backend schema confirmation -->
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }: { path: string }) => path === 'config.keepalive'"
      >
        <NumberField
          v-bind="slotProps"
          :label="t('plugins.free-form.governance.fields.keepalive.label')"
        />
      </FieldRenderer>
    </template>

    <!-- ── Section 2: Plugin configuration ────────────────────────────── -->
    <template #section-configuration>
      <!-- Customer: rendered flat (no collapsible group). `as-child` drops the
           ObjectField header; the render-rule keeps `field` visible only for
           header|query. -->
      <div class="ff-entitlement-enforcement-subject">
        <ObjectField
          as-child
          name="config.customer"
          :render-rules="{
            dependencies: {
              field: ['look_up_value_in', ['header', 'query']],
            },
          }"
          reset-label-path="reset"
        />
      </div>

      <!-- Feature — async select backed by the OpenMeter features endpoint. -->
      <FeatureSelectField @click:create-entity="(payload) => emit('click:create-entity', payload)" />

      <!-- Connection -->
      <h3 class="ff-entitlement-enforcement-connection-heading">
        {{ t('plugins.free-form.governance.sections.connection.title') }}
      </h3>

      <StringField
        :help="t('plugins.free-form.governance.fields.governance_endpoint.help')"
        name="config.governance_endpoint"
      />
      <Field name="config.api_token" />
      <Field name="config.ssl_verify" />
      <div class="ff-entitlement-enforcement-inline-row">
        <Field name="config.timeout" />
        <Field name="config.keepalive" />
      </div>
      <!-- Redis — shared (partial) vs dedicated. Rendered directly (rather than via
           `<Field name="config.redis" />`) so we can pass `borderless`, which drops
           the surrounding KCard chrome to sit flush in the form. Still requires the
           schema to declare `supported_partials: { 'redis-ce': ['config.redis'] }`
           so REDIS_PARTIAL_INFO resolves this path. -->
      <RedisSelector
        borderless
        :is-konnect-managed-redis-enabled="props.isKonnectManagedRedisEnabled ?? false"
      />

      <!-- Cache & sync settings (in AdvancedFields, grouped under a collapse) -->
      <AdvancedFields
        class="ff-entitlement-enforcement-advanced-fields-container"
        data-testid="ff-entitlement-enforcement-config-advanced-fields"
        hide-general-fields
      >
        <div>
          <h3 class="ff-entitlement-enforcement-cache-sync-heading">
            {{ t('plugins.free-form.governance.sections.cache_sync.title') }}
          </h3>
          <div class="ff-entitlement-enforcement-cache-sync">
            <NumberField
              :label="t('plugins.free-form.governance.fields.sync_rate.label')"
              name="config.sync_rate"
            />
            <NumberField
              :label="t('plugins.free-form.governance.fields.refresh_interval.label')"
              name="config.refresh_interval"
            />
            <NumberField
              :label="t('plugins.free-form.governance.fields.max_stale_seconds.label')"
              name="config.max_stale_seconds"
            />
            <NumberField
              :label="t('plugins.free-form.governance.fields.l1_ttl.label')"
              name="config.l1_cache_ttl_seconds"
            />
            <NumberField
              :label="t('plugins.free-form.governance.fields.l2_ttl.label')"
              name="config.l2_cache_ttl_seconds"
            />
          </div>
        </div>
      </AdvancedFields>
    </template>

    <!-- ── Section 3: Entitlement Enforcement settings ──────────────────── -->
    <template #section-entitlement-enforcement>
      <!-- credit_balance_required — 2-card boolean radio
           CardRadioField calls useFormShared() internally; rendered inside
           Form.vue's provider context via the slot. -->
      <CardRadioField
        :label="t('plugins.free-form.governance.fields.credit_balance_required.label')"
        name="config.credit_balance_required"
        :options="creditBalanceOptions"
      />

      <!-- fail_policy — 2-card enum radio -->
      <CardRadioField
        :label="t('plugins.free-form.governance.fields.fail_policy.label')"
        name="config.fail_policy"
        :options="failPolicyOptions"
      />

      <!-- Advanced settings within the entitlement enforcement section -->
      <AdvancedFields
        class="ff-entitlement-enforcement-advanced-fields-container"
        data-testid="ff-entitlement-enforcement-advanced-settings"
        hide-general-fields
      >
        <!-- Response mapping — fixed 5 rows, editable status/message -->

        <div>
          <h3 class="ff-entitlement-enforcement-response-mapping-heading">
            {{ t('plugins.free-form.governance.fields.response.label') }}
          </h3>
          <ResponseMappingField />
        </div>

        <!-- deny_unknown_customers — collapsible group of Allow/Deny cards -->

        <div>
          <h3 class="ff-entitlement-enforcement-deny-unknown-customers-heading">
            {{ t('plugins.free-form.governance.fields.deny_unknown_customers.label') }}
          </h3>
          <CardRadioField
            name="config.deny_unknown_customers"
            :options="denyUnknownCustomersOptions"
          />
        </div>
      </AdvancedFields>
    </template>
  </DynamicLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME, FORMS_CONFIG } from '@kong-ui-public/forms'
import { computed, inject, onUnmounted, provide } from 'vue'
import { BEFORE_SAVE_KEY } from '../../../const'
import type { KonnectBaseFormConfig, KongManagerBaseFormConfig } from '@kong-ui-public/entities-shared'
import DynamicLayout from '../../shared/layout/DynamicLayout.vue'
import FieldRenderer from '../../shared/FieldRenderer.vue'
import Field from '../../shared/Field.vue'
import BooleanField from '../../shared/BooleanField.vue'
import EnumField from '../../shared/EnumField.vue'
import NumberField from '../../shared/NumberField.vue'
import StringField from '../../shared/StringField.vue'
import ObjectField from '../../shared/ObjectField.vue'
import AdvancedFields from '../../shared/AdvancedFields.vue'
import RedisSelector from '../../shared/RedisSelector.vue'
import useI18n from '../../../../composables/useI18n'
import type { PluginFormLayoutProps as Props } from '../../shared/layout/provider'
import type { ConfigSection } from '../../shared/types'
import type { EntityCreateEvent } from '../../../../types'
import ResponseMappingField from './ResponseMappingField.vue'
import CardRadioField from './CardRadioField.vue'
import FeatureSelectField from './FeatureSelectField.vue'

const props = defineProps<Props>()

const emit = defineEmits<{
  'click:create-entity': [payload: EntityCreateEvent]
}>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const { i18n: { t } } = useI18n()

const appConfig = inject<KonnectBaseFormConfig | KongManagerBaseFormConfig | undefined>(FORMS_CONFIG)

// Entitlement Enforcement isn't configurable in Kong Manager yet — render a notice instead of the
// form (see template) and block Save via a before-save guard. Using the guard rather
// than onValidityChange avoids surfacing a second, duplicate error alert.
const isKongManager = computed(() => appConfig?.app === 'kongManager')

const registerBeforeSave = inject(BEFORE_SAVE_KEY)
const unregisterBeforeSave = registerBeforeSave?.(() => !isKongManager.value)
onUnmounted(() => unregisterBeforeSave?.())

const governanceEndpointUrl = computed(() => {
  const geo = (appConfig as KonnectBaseFormConfig)?.geoApiServerUrl
  const region = geo ? new URL(geo).hostname.split('.')[0] : null
  return region
    ? `https://${region}.api.konghq.com/v3/openmeter/governance/query`
    : 'https://us.api.konghq.com/v3/openmeter/governance/query'
})

const formConfig = {
  hasValue: (data: any): boolean => !!data && Object.keys(data).length > 0,
  prepareFormData: (data: any): any => {
    if (props.isEditing) return data

    // Prefill governance_endpoint for new Konnect plugins; Kong Manager has no regional endpoint
    if ((appConfig as KonnectBaseFormConfig)?.app === 'konnect' && !data?.config?.governance_endpoint) {
      return {
        ...data,
        config: { ...data?.config, governance_endpoint: governanceEndpointUrl.value },
      }
    }

    return data
  },
}

const configSections: ConfigSection[] = [
  {
    name: 'configuration',
    title: t('plugins.free-form.governance.sections.configuration.title'),
    description: t('plugins.free-form.governance.sections.configuration.description'),
  },
  {
    name: 'entitlement-enforcement',
    title: t('plugins.free-form.governance.sections.governance.title'),
    description: t('plugins.free-form.governance.sections.governance.description'),
  },
]

// ── Card-radio option sets (static, translated at setup time) ─────────────

const creditBalanceOptions = computed(() => [
  {
    value: true,
    label: t('plugins.free-form.governance.fields.credit_balance_required.yes_label'),
    description: t('plugins.free-form.governance.fields.credit_balance_required.yes_description'),
  },
  {
    value: false,
    label: t('plugins.free-form.governance.fields.credit_balance_required.no_label'),
    description: t('plugins.free-form.governance.fields.credit_balance_required.no_description'),
  },
])

const failPolicyOptions = computed(() => [
  {
    value: 'allow',
    label: t('plugins.free-form.governance.fields.fail_policy.allow_label'),
    description: t('plugins.free-form.governance.fields.fail_policy.allow_description'),
  },
  {
    value: 'deny',
    label: t('plugins.free-form.governance.fields.fail_policy.deny_label'),
    description: t('plugins.free-form.governance.fields.fail_policy.deny_description'),
  },
])

const denyUnknownCustomersOptions = computed(() => [
  {
    value: false,
    label: t('plugins.free-form.governance.fields.deny_unknown_customers.allow_label'),
    description: t('plugins.free-form.governance.fields.deny_unknown_customers.allow_description'),
  },
  {
    value: true,
    label: t('plugins.free-form.governance.fields.deny_unknown_customers.deny_label'),
    description: t('plugins.free-form.governance.fields.deny_unknown_customers.deny_description'),
  },
])
</script>

<style lang="scss" scoped>
// `as-child` ObjectField renders the subject fields without a header; lay the
// two fields (look_up_value_in + field) out side by side on one row.
.ff-entitlement-enforcement-subject :deep(.ff-object-field-as-child) {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: var(--kui-space-60, $kui-space-60);

  > * {
    flex: 1 1 calc(50% - var(--kui-space-60, $kui-space-60));
    min-width: 0;
  }
}

.ff-entitlement-enforcement-connection-heading,
.ff-entitlement-enforcement-cache-sync-heading,
.ff-entitlement-enforcement-deny-unknown-customers-heading,
.ff-entitlement-enforcement-response-mapping-heading {
  font-size: var(--kui-font-size-40, $kui-font-size-40);
  font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
  margin-bottom: var(--kui-space-50, $kui-space-50);
}

.ff-entitlement-enforcement-deny-unknown-customers-heading {
  margin-top: 0;
}

.ff-entitlement-enforcement-connection-heading {
  margin-bottom: 0;
  margin-top: 0;
}

.ff-entitlement-enforcement-inline-row {
  display: flex;
  gap: var(--kui-space-60, $kui-space-60);

  > * {
    flex: 1 1 0;
  }
}

.ff-entitlement-enforcement-advanced-fields-container {
  :deep(.collapse-heading) {
    margin: 0;
  }
}

// Cache and sync fields laid out two per row, as designed. Grid (not flex-wrap)
// so a lone item on the last row keeps its half-width column instead of
// stretching to fill the row.
.ff-entitlement-enforcement-cache-sync {
  display: grid;
  gap: var(--kui-space-60, $kui-space-60);
  grid-template-columns: repeat(2, 1fr);

  > * {
    min-width: 0;
  }
}
</style>
