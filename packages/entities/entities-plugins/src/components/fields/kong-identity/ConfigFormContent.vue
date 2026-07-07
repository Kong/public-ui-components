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
    :identity-realms-in-schema="identityRealmsInSchema"
    :loading-realms="isLoadingRealms"
  />

  <div
    v-if="isKonnect && identityRealmsInSchema && selectedMode === 'centrally-managed'"
    class="identity-realms-section"
    data-testid="identity-realms-section"
    @click="handleRealmFieldTouch"
  >
    <IdentityRealmsField
      name="$.config.identity_realms"
      :required="true"
    />
    <p
      v-if="realmValidationVisible"
      class="identity-realms-error"
      data-testid="identity-realms-validation-error"
    >
      {{ i18n.t('custom_field.kong_identity.identity_realms_required') }}
    </p>
  </div>
  <PrincipalsCreationGuide
    v-if="isKonnect && hasPrincipals && selectedMode === 'kong-identity'"
    class="kong-identity-principals-section"
    :data-plane-incompatible="hasIncompatibleDataPlane"
    :loading="principalsLoading"
    :show-panel="principalsShowPanel"
    @click:create-entity="(payload) => emit('click:create-entity', payload)"
    @click:learn-more="(entity: string) => emit('click:learn-more', entity)"
  />

  <AdvancedFields
    class="ff-advanced-fields-container"
    data-testid="ff-advanced-fields-container"
    hide-general-fields
  >
    <div
      v-if="isKonnect && hasPrincipals && selectedMode === 'kong-identity' && hasPrincipalsErrorOnMiss"
      class="kong-identity-error-on-miss"
    >
      <KLabel data-testid="ff-principals-error-on-miss-label">
        {{ i18n.t('custom_field.kong_identity.error_on_miss_label') }}
      </KLabel>
      <KRadio
        data-testid="principals-error-on-miss-true"
        :description="i18n.t('custom_field.kong_identity.error_on_miss_reject_description')"
        :disabled="principalsPanelVisible"
        :label="i18n.t('custom_field.kong_identity.error_on_miss_reject_label')"
        :model-value="principalsErrorOnMiss"
        :selected-value="true"
        @update:model-value="handleErrorOnMissChange"
      />
      <KRadio
        data-testid="principals-error-on-miss-false"
        :description="i18n.t('custom_field.kong_identity.error_on_miss_continue_description')"
        :disabled="principalsPanelVisible"
        :label="i18n.t('custom_field.kong_identity.error_on_miss_continue_label')"
        :model-value="principalsErrorOnMiss"
        :selected-value="false"
        @update:model-value="handleErrorOnMissChange"
      />
    </div>
    <ObjectField
      as-child
      name="config"
      :omit="advancedOmit"
      reset-label-path="reset"
    />
  </AdvancedFields>
</template>

<script setup lang="ts">
import { computed, inject, nextTick, onMounted, onUnmounted, provide, ref, watch } from 'vue'
import ObjectField from '../../free-form/shared/ObjectField.vue'
import AdvancedFields from '../../free-form/shared/AdvancedFields.vue'
import KongIdentityField from './KongIdentityField.vue'
import IdentityRealmsField from '../../free-form/plugins/key-auth/IdentityRealmsField.vue'
import PrincipalsCreationGuide from './PrincipalsCreationGuide.vue'
import { useFormShared } from '../../free-form/shared/composables'
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { useAxios } from '@kong-ui-public/entities-shared'
import { KLabel, KRadio } from '@kong/kongponents'
import { FETCHED_REALMS_KEY } from '../key-auth-identity-realms/const'
import { BEFORE_SAVE_KEY } from '../../const'
import { FORM_EDITING } from '../../free-form/shared/const'
import { FEATURE_FLAGS } from '../../../constants'
import composables from '../../../composables'

import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { MultiselectItem } from '@kong/kongponents'
import type { AxiosResponse } from 'axios'
import type { EntityCreateEvent, KonnectPluginFormConfig } from '../../../types'

const emit = defineEmits<{
  'click:learn-more': [entity: string]
  'click:create-entity': [payload: EntityCreateEvent]
}>()

// Kong Identity principals require Gateway 3.15+ on the data plane.
const KONG_IDENTITY_MIN_DP_VERSION = { major: 3, minor: 15 }

function isVersionBelowMinDpVersion(version: string): boolean {
  const [major, minor] = version.split('.').map(Number)
  if (Number.isNaN(major) || Number.isNaN(minor)) return false
  if (major !== KONG_IDENTITY_MIN_DP_VERSION.major) return major < KONG_IDENTITY_MIN_DP_VERSION.major
  return minor < KONG_IDENTITY_MIN_DP_VERSION.minor
}

const registerBeforeSave = inject(BEFORE_SAVE_KEY)
const isEditing = inject(FORM_EDITING)

const { i18n } = composables.useI18n()

const appConfig = inject<KongManagerBaseFormConfig | KonnectBaseFormConfig | undefined>(FORMS_CONFIG)
const isKonnect = computed(() => appConfig?.app === 'konnect')
const { axiosInstance } = useAxios(appConfig?.axiosRequestConfig)

const { formData, getSchema } = useFormShared()

const hasPrincipalsErrorOnMiss = computed(() => !!getSchema('$.config.principals.error_on_miss'))

// Host-precomputed (see KonnectPluginFormConfig): directory access → directory resolved →
// principals (list) access on that directory → principals list empty → create-principal
// permission. `undefined` means the host hasn't resolved this yet.
const principalsCreationGuideVisible = computed(() => (appConfig as KonnectPluginFormConfig)?.principalsCreationGuideVisible)

const principalsShowPanel = computed(() => principalsCreationGuideVisible.value === true)
const principalsLoading = computed(() => principalsCreationGuideVisible.value === undefined)

// Fields are meaningful once the user has principals access at all — mirrors hasPrincipals
// rather than independently tracking whether principals currently exist.
const principalsPanelVisible = computed(() => isKonnect.value && !hasPrincipals.value)

const principalsErrorOnMiss = computed(() => formData.config?.principals?.error_on_miss ?? true)

function handleErrorOnMissChange(value: boolean) {
  if (formData.config?.principals) {
    formData.config.principals.error_on_miss = value
  }
}

// Fetch realms from API only when the Konnect identity realms field is relevant
type KonnectRealmResponse = { data: Array<{ id: string, name: string }>, meta: { next: string | null } }

const fetchedRealms = ref<MultiselectItem[]>([])
const isLoadingRealms = ref(false)

const fetchRealms = async () => {
  if (appConfig?.app !== 'konnect' || !identityRealmsInSchema.value) return

  try {
    isLoadingRealms.value = true
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
  } catch {
    fetchedRealms.value = []
  } finally {
    isLoadingRealms.value = false
  }
}

onMounted(fetchRealms)

// Provide fetched realms to IdentityRealmsField (rendered via FieldRenderer)
provide(FETCHED_REALMS_KEY, fetchedRealms)

// Auto-detect from schema
const identityRealmsInSchema = computed(() => !!getSchema('$.config.identity_realms'))

// Feature-flagged: when the consuming app hasn't enabled the Identity Principals UI,
// behave as if `principals` isn't in the schema — every piece of the new UI keys off
// `hasPrincipals`, so the form falls back to the legacy rendering (and `principals`
// keeps its prefilled schema default, submitted as-is).
const identityPrincipalsUiEnabled = inject<boolean>(FEATURE_FLAGS.KHCP_20393_IDENTITY_PRINCIPALS_UI, false)

const hasPrincipals = computed(() =>
  identityPrincipalsUiEnabled
  && !!getSchema('$.config.principals')
  && (appConfig as KonnectPluginFormConfig)?.isKongIdentityPrincipalsAvailable !== false,
)

// True when at least one connected data plane node can't process Kong Identity principals
// (Gateway 3.15+ required). Drives a warning alert, not field hiding.
const hasIncompatibleDataPlane = computed(() =>
  ((appConfig as KonnectPluginFormConfig)?.dataPlaneVersions ?? []).some(isVersionBelowMinDpVersion),
)

function detectInitialMode(): 'consumers' | 'kong-identity' | 'centrally-managed' {
  if (formData.config?.principals?.enabled) return 'kong-identity'
  // For Konnect: only treat as centrally-managed when there's at least one non-CP realm
  if (isKonnect.value) {
    if (hasActualRealm(formData.config?.identity_realms)) return 'centrally-managed'
  } else {
    if (Array.isArray(formData.config?.identity_realms) && formData.config.identity_realms.length > 0) return 'centrally-managed'
  }
  return 'consumers'
}

// A 'real' realm is one with scope !== 'cp' and a non-null id
function hasActualRealm(realms: any[] | null | undefined): boolean {
  if (!Array.isArray(realms) || realms.length === 0) return false
  return realms.some((r) => r.scope !== 'cp' && r.id != null)
}

const selectedMode = ref<'consumers' | 'kong-identity' | 'centrally-managed'>(detectInitialMode())

// Create flow: adopt on mount or when host resolves late. Edit-load preserves saved value.
watch(
  () => (appConfig as KonnectPluginFormConfig)?.principalsDirectoryName,
  (name) => {
    if (isEditing?.value || selectedMode.value !== 'kong-identity' || name == null) return
    if (formData.config?.principals) {
      formData.config.principals.directory = name
    }
  },
  { immediate: true },
)

// Explicit mode switch to kong-identity: adopt directory for both create and edit flows.
watch(selectedMode, (newMode) => {
  if (newMode !== 'kong-identity') return
  const dir = (appConfig as KonnectPluginFormConfig)?.principalsDirectoryName
  if (dir == null || !formData.config?.principals) return
  formData.config.principals.directory = dir
})

// Show validation error when centrally-managed mode is active but no real realm is selected
const realmValidationError = computed(() =>
  isKonnect.value
  && selectedMode.value === 'centrally-managed'
  && !hasActualRealm(formData.config?.identity_realms),
)

// Touch tracking: show the inline error only after the user interacts with the
// multiselect. We use nextTick to let the programmatic identity_realms change
// (set by handleModeChange when entering centrally-managed) flush first, so
// only genuine user changes flip the touched flag.
const realmFieldTouched = ref(false)
const realmSubmitAttempted = ref(false)
let realmTouchReady = false

watch(selectedMode, async (mode) => {
  if (mode !== 'centrally-managed') return
  realmFieldTouched.value = false
  realmSubmitAttempted.value = false
  realmTouchReady = false
  await nextTick()
  realmTouchReady = true
})

// When entering edit mode with existing realms, selectedMode starts as 'centrally-managed'
// without ever triggering the watcher above, so realmTouchReady stays false.
// Set it on mount so user edits (e.g. removing a realm) are tracked.
onMounted(() => {
  if (selectedMode.value === 'centrally-managed') {
    realmTouchReady = true
  }
})

watch(() => formData.config?.identity_realms, () => {
  if (selectedMode.value === 'centrally-managed' && realmTouchReady) {
    realmFieldTouched.value = true
  }
}, { deep: true })

function handleRealmFieldTouch() {
  if (realmTouchReady) {
    realmFieldTouched.value = true
  }
}

// Inline error: visible after touch or a blocked submit attempt, auto-clears when valid
const realmValidationVisible = computed(() =>
  (realmFieldTouched.value || realmSubmitAttempted.value) && realmValidationError.value,
)

// Before-save guard: block submission and reveal the error if no realm is selected
const unregisterBeforeSave = registerBeforeSave?.(() => {
  if (realmValidationError.value) {
    realmSubmitAttempted.value = true
    return false
  }
  return true
})
onUnmounted(() => unregisterBeforeSave?.())

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
  if (isKonnect.value && identityRealmsInSchema.value && !hasPrincipals.value) {
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

.identity-realms-section {
  + .ff-advanced-fields-container {
    border-top: none;
    padding-top: 0;
  }
}

.identity-realms-error {
  color: var(--kui-color-text-danger, $kui-color-text-danger);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  margin-bottom: 0;
  margin-top: var(--kui-space-30, $kui-space-30);
}

.kong-identity-error-on-miss {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);
}

.kong-identity-principals-section + .ff-advanced-fields-container {
  border-top: none;
  padding-top: 0;
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
