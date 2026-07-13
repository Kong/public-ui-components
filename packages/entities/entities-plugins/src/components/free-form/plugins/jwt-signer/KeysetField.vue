<template>
  <StringField
    v-bind="$attrs"
    :error="error"
    :error-message="errorMessage"
    :name="name"
  />
</template>

<script setup lang="ts">
import { FORMS_CONFIG } from '@kong-ui-public/forms'
import { computed, inject } from 'vue'

import useI18n from '../../../../composables/useI18n'
import StringField from '../../shared/StringField.vue'
import { defaultLabelFormatter, useFormShared } from '../../shared/composables'

import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { FreeFormPluginData } from '../../../../types/plugins/free-form'

defineOptions({ inheritAttrs: false })

interface JwtSignerConfig {
  access_token_signing?: boolean
  access_token_upstream_header?: string | null
  access_token_keyset?: string | null
  channel_token_signing?: boolean
  channel_token_upstream_header?: string | null
  channel_token_keyset?: string | null
}

const props = defineProps<{
  name: string
  scope: 'access' | 'channel'
}>()

const { i18n: { t } } = useI18n()

const appConfig = inject<KongManagerBaseFormConfig | KonnectBaseFormConfig | undefined>(FORMS_CONFIG)
const isKonnect = computed(() => appConfig?.app === 'konnect')

const { formData, config: sharedConfig } = useFormShared<FreeFormPluginData<JwtSignerConfig>>()

function fieldLabel(fieldName: string): string {
  const path = `config.${fieldName}`
  const formatted = defaultLabelFormatter(fieldName)
  return sharedConfig.value.transformLabel ? sharedConfig.value.transformLabel(formatted, path) : formatted
}

function isHttpOrHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string' || !value) return false
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && !!url.host
  } catch {
    return false
  }
}

const validation = computed(() => {
  // No validation for Kong Manager
  if (!isKonnect.value) return { hasError: false, message: '' }

  const config = formData.config
  const signing = config?.[`${props.scope}_token_signing`]
  const upstreamHeader = config?.[`${props.scope}_token_upstream_header`]

  if (!signing) return { hasError: false, message: '' }
  if (typeof upstreamHeader !== 'string' || upstreamHeader === '') return { hasError: false, message: '' }

  const keyset = config?.[`${props.scope}_token_keyset`]
  if (isHttpOrHttpsUrl(keyset)) return { hasError: false, message: '' }

  return {
    hasError: true,
    message: t('plugins.free-form.jwt-signer.keyset_url_required', {
      signingField: fieldLabel(`${props.scope}_token_signing`),
      headerField: fieldLabel(`${props.scope}_token_upstream_header`),
    }),
  }
})

const error = computed(() => validation.value.hasError)
const errorMessage = computed(() => validation.value.message)
</script>
