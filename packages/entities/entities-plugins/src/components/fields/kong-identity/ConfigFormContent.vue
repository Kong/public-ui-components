<template>
  <ObjectField
    as-child
    class="ff-default-visible-fields"
    name="config"
    :omit="topOmit"
    reset-label-path="reset"
  />

  <KongIdentityField
    v-if="isKonnect && hasPrincipals"
    v-model="selectedMode"
    class="kong-identity-section"
    :has-existing-realms="hasExistingRealms"
    :identity-realms-in-schema="identityRealmsInSchema"
  />

  <AdvancedFields
    class="ff-advanced-fields-container"
    data-testid="ff-advanced-fields-container"
    hide-general-fields
  >
    <ObjectField
      as-child
      name="config"
      :omit="advancedOmit"
      reset-label-path="reset"
    />
  </AdvancedFields>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, provide, ref } from 'vue'
import ObjectField from '../../free-form/shared/ObjectField.vue'
import AdvancedFields from '../../free-form/shared/AdvancedFields.vue'
import KongIdentityField from './KongIdentityField.vue'
import { useFormShared } from '../../free-form/shared/composables'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { useAxios } from '@kong-ui-public/entities-shared'
import { FETCHED_REALMS_KEY } from '../key-auth-identity-realms/const'

import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { MultiselectItem } from '@kong/kongponents'
import type { AxiosResponse } from 'axios'

const appConfig = inject<KongManagerBaseFormConfig | KonnectBaseFormConfig | undefined>(FORMS_CONFIG)
const isKonnect = computed(() => appConfig?.app === 'konnect')
const { axiosInstance } = useAxios(appConfig?.axiosRequestConfig)

const { formData, getSchema } = useFormShared()

// Fetch realms from API only when the Konnect identity realms field is relevant
type KonnectRealmResponse = { data: Array<{ id: string, name: string }>, meta: { next: string | null } }

const fetchedRealms = ref<MultiselectItem[]>([])
const hasExistingRealms = ref(false)

const fetchRealms = async () => {
  if (appConfig?.app !== 'konnect' || !identityRealmsInSchema.value) return

  try {
    let nextUrl: string | null = `${appConfig.apiBaseUrl}/v1/realms`
    const items: MultiselectItem[] = []

    do {
      const resp: AxiosResponse<KonnectRealmResponse> = await axiosInstance.get(nextUrl)
      if (resp?.data?.data) {
        items.push(...resp.data.data.map((realm) => ({
          value: realm.id,
          label: realm.name,
        })))
      }
      nextUrl = resp.data.meta.next ? `${appConfig.apiBaseUrl}${resp.data.meta.next}` : null
    } while (nextUrl)

    fetchedRealms.value = items
    hasExistingRealms.value = items.length > 0
  } catch {
    hasExistingRealms.value = false
  }
}

onMounted(fetchRealms)

// Provide fetched realms to IdentityRealmsField (rendered via FieldRenderer)
provide(FETCHED_REALMS_KEY, fetchedRealms)

// Auto-detect from schema
const identityRealmsInSchema = computed(() => !!getSchema('$.config.identity_realms'))

const hasPrincipals = computed(() => !!getSchema('$.config.principals'))

function detectInitialMode(): 'consumers' | 'kong-identity' | 'centrally-managed' {
  if (formData.config?.principals?.enabled) return 'kong-identity'
  if (Array.isArray(formData.config?.identity_realms) && formData.config.identity_realms.length > 0) return 'centrally-managed'
  return 'consumers'
}

const selectedMode = ref<'consumers' | 'kong-identity' | 'centrally-managed'>(detectInitialMode())

const realmRequired = computed(() => !!getSchema('$.config.realm')?.required)

// Top section: omit advanced fields + always-hidden identity fields
const topOmit = computed(() => {
  const omit = ['anonymous', 'principals', 'identity_realms']
  if (!realmRequired.value) {
    omit.push('realm')
  }
  return omit
})

// Advanced section: show only anonymous + conditionally realm/identity_realms
const advancedOmit = computed(() => {
  const schema = getSchema('$.config') as { fields?: Array<Record<string, unknown>> } | undefined
  const allFields: string[] = schema?.fields?.map((f: Record<string, unknown>) => Object.keys(f)[0]) ?? []

  const advancedSet = new Set(['anonymous'])
  if (!realmRequired.value && selectedMode.value !== 'kong-identity') {
    advancedSet.add('realm')
  }
  if (isKonnect.value && identityRealmsInSchema.value && (!hasPrincipals.value || selectedMode.value === 'centrally-managed')) {
    advancedSet.add('identity_realms')
  }

  return allFields.filter(f => !advancedSet.has(f))
})
</script>

<style lang="scss" scoped>
.kong-identity-section {
  border-top: 1px solid var(--kui-color-border, $kui-color-border);
  margin-top: var(--kui-space-70, $kui-space-70);
  padding-top: var(--kui-space-70, $kui-space-70);

  + .ff-advanced-fields-container {
    border-top: none;
    padding-top: 0;
  }
}

.ff-advanced-fields-container {
  border-top: 1px solid var(--kui-color-border, $kui-color-border);
  padding-top: var(--kui-space-70, $kui-space-70);

  :deep(.collapse-heading) {
    margin: 0;
  }

  &:has(> .collapse-hidden-content > .ff-advanced-fields > .ff-object-field:empty:only-child) {
    display: none;
  }
}
</style>
