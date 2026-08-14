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
    :schema="credentialSchema"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAxios } from '@kong-ui-public/entities-shared'
import composables from '../composables'
import CredentialSecretField from './free-form/shared/CredentialSecretField.vue'
import PluginConfigurationForm from './free-form/shared/layout/PluginConfigurationForm.vue'
import StringArrayField from './free-form/shared/StringArrayField.vue'
import { CREDENTIAL_METADATA, CREDENTIAL_SCHEMAS } from '../definitions/metadata'
import endpoints from '../plugins-endpoints'
import { resolvePluginConfigUrl } from '../utils/resolve-url'
import type { CredentialType, KongManagerPluginFormConfig, KonnectPluginFormConfig } from '../types'
import type { FieldRenderer } from './free-form/shared/types'

// Fields that are backend-generated and shouldn't be shown/edited in the credential form.
// (`key` etc. are also auto-generated when left blank, but they remain user-editable, so we
// can't filter generically on the `auto` flag - only these specific fields are excluded.)
const OMITTED_CREDENTIAL_FIELDS = new Set(['id', 'created_at', 'consumer'])

const { i18n: { t } } = composables.useI18n()

const { config, credentialType } = defineProps<{
  config: KonnectPluginFormConfig | KongManagerPluginFormConfig
  credentialType: CredentialType
}>()

const emit = defineEmits<{
  'update:modelValue': [model: Record<string, any>]
  'update:loading': [loading: boolean]
  'error:fetch-schema': [error: unknown]
}>()

const { axiosInstance } = useAxios(config?.axiosRequestConfig)

// Stable object reference: passed as `PluginConfigurationForm`'s `model`, mutated in place via
// `handleFormChange` so unrelated re-renders don't reset it.
const credentialModel = ref<Record<string, any>>({})
const handleFormChange = (value: Record<string, any>): void => {
  credentialModel.value = value
  emit('update:modelValue', value)
}

const schemaLoading = ref(false)
watch(schemaLoading, (loading) => emit('update:loading', loading), { immediate: true })

const rawCredentialSchema = ref<Record<string, any>>()

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

const fieldRenderers: FieldRenderer[] = [
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
  },
  {
    match: 'secret',
    component: CredentialSecretField,
    propsOverrides: {
      labels: { generateLabel: t('plugins.form.fields.secret.generateLabel') },
    },
  },
]

const schemaEndpoint = computed(() => CREDENTIAL_METADATA[credentialType]?.schemaEndpoint)

const schemaUrl = computed((): string => {
  return resolvePluginConfigUrl(config, endpoints.form[config.app].credentialSchema)
    .replace(/{plugin}/gi, schemaEndpoint.value)
})

const loadCredentialSchema = async (): Promise<void> => {
  schemaLoading.value = true

  try {
    // Konnect has no credential schema endpoint - fall back to the hard-coded schemas.
    if (config.app === 'konnect') {
      rawCredentialSchema.value = CREDENTIAL_SCHEMAS[schemaEndpoint.value]
    } else {
      const { data } = await axiosInstance.get(schemaUrl.value)
      rawCredentialSchema.value = data
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
