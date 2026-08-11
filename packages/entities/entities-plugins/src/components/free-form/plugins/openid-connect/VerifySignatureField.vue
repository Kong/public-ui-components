<template>
  <BooleanField
    :description="description"
    :name="name"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import useI18n from '../../../../composables/useI18n'
import BooleanField from '../../shared/BooleanField.vue'
import { useFormData } from '../../shared/composables'

const props = defineProps<{
  name: string
}>()

const { i18n: { t } } = useI18n()

const { value } = useFormData<boolean | null>(() => props.name)

// JWKs are auto-fetched from the issuer's well-known endpoint when signature verification
// is on; surface that (and the jwks_uri override) only in that state.
const description = computed(() =>
  value.value === true
    ? t('plugins.free-form.openid-connect.advanced_fields.verify_signature_description')
    : undefined,
)
</script>
