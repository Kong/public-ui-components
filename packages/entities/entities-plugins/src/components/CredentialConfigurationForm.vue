<template>
  <KSkeleton
    v-if="schemaLoading"
    type="form"
  />
  <PluginConfigurationForm
    v-else-if="credentialSchema"
    class="credential-fields"
    :field-renderers="fieldRenderers"
    :model="credentialModel"
    :on-form-change="handleFormChange"
    :plugin-name="credentialType"
    :render-rules="renderRules"
    :schema="credentialSchema"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { pick } from 'lodash-es'
import { useAxios } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import CredentialSecretField from './free-form/components/CredentialSecretField.vue'
import PluginConfigurationForm from './free-form/components/PluginConfigurationForm.vue'
import { StringArrayField, StringField } from '@kong-ui-public/freeform'
import type { FieldRendererRule, RenderRules } from '@kong-ui-public/freeform'
import { CREDENTIAL_METADATA, CREDENTIAL_SCHEMAS } from '../definitions/metadata'
import endpoints from '../plugins-endpoints'
import { resolvePluginConfigUrl } from '../utils/resolve-url'
import type { CredentialType, KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../types'

// Fields that are backend-generated and shouldn't be shown/edited in the credential form.
// (`key` etc. are also auto-generated when left blank, but they remain user-editable, so we
// can't filter generically on the `auto` flag - only these specific fields are excluded.)
const OMITTED_CREDENTIAL_FIELDS = new Set(['id', 'created_at', 'consumer'])

// JWT algorithms that verify tokens with `rsa_public_key` (RS*, PS*, ES* and EdDSA).
const ASYMMETRIC_JWT_ALGORITHMS = [
  ...['RS', 'PS', 'ES'].flatMap((prefix) => ['256', '384', '512'].map((bits) => `${prefix}${bits}`)),
  'EdDSA',
]

const { i18n: { t } } = composables.useI18n()

const { config, credentialType, schema, record, editing = false } = defineProps<{
  config: KonnectPluginFormConfig | KongManagerPluginFormConfig
  credentialType: CredentialType
  /** An already-loaded credential schema. When provided, the schema is not fetched again. */
  schema?: Record<string, any>
  /** The existing credential record to prefill the form with (edit mode). */
  record?: Record<string, any>
  /** Render secret fields (`key`, `secret`) masked, with a "Rotate key" action. */
  editing?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [model: Record<string, any>]
  'update:loading': [loading: boolean]
  'error:fetch-schema': [error: unknown]
}>()

const { axiosInstance } = useAxios(config?.axiosRequestConfig)

const schemaLoading = ref(false)
watch(schemaLoading, (loading) => emit('update:loading', loading), { immediate: true })

const rawCredentialSchema = ref<Record<string, any> | undefined>(schema)
watch(() => schema, (newSchema) => {
  if (newSchema) {
    rawCredentialSchema.value = newSchema
  }
})

const fieldName = (field: Record<string, any>): string => Object.keys(field)[0]
const credentialSchema = computed(() => {
  if (!rawCredentialSchema.value) {
    return undefined
  }

  return {
    ...rawCredentialSchema.value,
    type: 'record' as const,
    fields: rawCredentialSchema.value.fields
      .filter((field: Record<string, any>) => !OMITTED_CREDENTIAL_FIELDS.has(fieldName(field)))
      // freeform doesn't recognize the `hint` property in mocked schema - it only reads
      // `description` (rendered as a label tooltip), so fall back to it here.
      .map((field: Record<string, any>) => {
        const name = fieldName(field)
        const def = field[name]

        return def.description || !def.hint ? field : { [name]: { ...def, description: def.hint } }
      }),
  }
})

// Only the schema fields are part of the model: backend-only properties (`updated_at`, etc.) of an
// existing record must not be sent back.
const initialModel = (): Record<string, any> => {
  if (!record || !credentialSchema.value) {
    return {}
  }

  return pick(record, credentialSchema.value.fields.map(fieldName))
}

// The model passed to `PluginConfigurationForm`, replaced with the latest form value on every
// change (the form ignores an equal value, so this doesn't reset it).
const credentialModel = ref<Record<string, any>>(initialModel())
const handleFormChange = (value: Record<string, any>): void => {
  credentialModel.value = value
  emit('update:modelValue', value)
}

const fieldRenderers = computed((): FieldRendererRule[] => [
  {
    match: 'tags',
    component: StringArrayField,
    propsOverrides: {
      help: t('plugins.form.fields.tags.help'),
      placeholder: t('plugins.form.fields.tags.placeholder'),
    },
  },
  {
    match: 'key',
    component: CredentialSecretField,
    propsOverrides: { mode: editing ? 'edit' : 'create' },
  },
  {
    match: 'secret',
    component: CredentialSecretField,
    propsOverrides: {
      labels: { generateLabel: t('plugins.form.fields.secret.generateLabel') },
      mode: editing ? 'edit' : 'create',
    },
  },
  // JWT: PEM-formatted public key
  {
    match: 'rsa_public_key',
    component: StringField,
    propsOverrides: { multiline: true, rows: 10 },
  },
])

// JWT: the public key is only relevant for the asymmetric algorithms.
const renderRules = computed((): RenderRules | undefined => {
  if (credentialType !== 'jwt') {
    return undefined
  }

  return {
    dependencies: {
      rsa_public_key: ['algorithm', ASYMMETRIC_JWT_ALGORITHMS],
    },
  }
})

const schemaEndpoint = computed(() => CREDENTIAL_METADATA[credentialType]?.schemaEndpoint)

const schemaUrl = computed((): string => {
  return resolvePluginConfigUrl(config, endpoints.form[config.app].credentialSchema)
    .replace(/{plugin}/gi, schemaEndpoint.value)
})

const loadCredentialSchema = async (): Promise<void> => {
  if (rawCredentialSchema.value) {
    return
  }

  schemaLoading.value = true

  try {
    // Konnect has no credential schema endpoint - fall back to the hard-coded schemas.
    if (config.app === 'konnect') {
      rawCredentialSchema.value = CREDENTIAL_SCHEMAS[schemaEndpoint.value]
    } else {
      const { data } = await axiosInstance.get(schemaUrl.value)
      rawCredentialSchema.value = data
    }

    if (record) {
      credentialModel.value = initialModel()
    }
  } catch (error: any) {
    emit('error:fetch-schema', error)
  } finally {
    schemaLoading.value = false
  }
}

loadCredentialSchema()
</script>

<style lang="scss" scoped>
.credential-fields {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-80, $kui-space-80);
}
</style>
