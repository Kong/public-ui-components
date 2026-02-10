<template>
  <StandardLayout v-bind="props">
    <template #field-renderers>
      <FieldRenderer
        v-slot="slotProps"
        :match="({ path }) => path === 'config.identity_realms'"
      >
        <IdentityRealmsField
          v-if="isKonnect"
          v-bind="slotProps"
        />
        <span
          v-else
          hidden
        />
      </FieldRenderer>
    </template>

    <ConfigForm />
  </StandardLayout>
</template>

<script setup lang="ts">
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME, FORMS_CONFIG } from '@kong-ui-public/forms'
import { computed, inject, provide } from 'vue'
import ConfigForm from '../Common/ConfigForm.vue'
import StandardLayout from '../shared/layout/StandardLayout.vue'
import FieldRenderer from '../shared/FieldRenderer.vue'
import IdentityRealmsField from '../../fields/key-auth-identity-realms/FreeFormAdapter.vue'

import type { KongManagerBaseFormConfig, KonnectBaseFormConfig } from '@kong-ui-public/entities-shared'
import type { Props } from '../shared/layout/StandardLayout.vue'

const props = defineProps<Props>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])

const appConfig = inject<KongManagerBaseFormConfig | KonnectBaseFormConfig | undefined>(FORMS_CONFIG)
const isKonnect = computed(() => appConfig?.app === 'konnect')
</script>
