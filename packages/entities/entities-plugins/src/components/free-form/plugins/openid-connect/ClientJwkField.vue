<template>
  <div class="oidc-client-jwk-field">
    <ArrayField
      appearance="tabs"
      :item-label="(_, idx) => `#${idx + 1} Client JWK`"
      :name="name"
    >
      <template #label>
        {{ t('plugins.free-form.openid-connect.advanced_fields.client_jwk_link_label') }}
        <KExternalLink
          class="oidc-client-jwk-link"
          href="https://developer.konghq.com/plugins/openid-connect/reference/#schema--config-client-jwk"
        >
          More info
        </KExternalLink>
      </template>
    </ArrayField>
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
    margin-left: var(--kui-space-20, $kui-space-20);
  }
}
</style>
