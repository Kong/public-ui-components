<template>
  <div class="oidc-client-jwk-field">
    <KExternalLink
      class="oidc-client-jwk-link"
      href="https://developer.konghq.com/plugins/openid-connect/reference/#schema--config-client-jwk"
    >
      {{ t('plugins.free-form.openid-connect.advanced_fields.client_jwk_link_label') }}
    </KExternalLink>
    <ArrayField
      hide-label
      :name="name"
    />
  </div>
</template>

<script setup lang="ts">
import { KExternalLink } from '@kong/kongponents'
import useI18n from '../../../../composables/useI18n'
import ArrayField from '../../shared/ArrayField.vue'

defineProps<{
  name: string
}>()

const { i18n: { t } } = useI18n()
</script>

<style lang="scss" scoped>
.oidc-client-jwk-field {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);

  .oidc-client-jwk-link {
    align-self: flex-start;
  }
}
</style>
