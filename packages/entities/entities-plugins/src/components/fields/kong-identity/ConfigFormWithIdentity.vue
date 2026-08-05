<template>
  <DynamicLayout
    v-bind="props"
    :field-renderers="FIELD_RENDERERS"
    :render-rules="RENDER_RULES"
  >
    <ConfigFormContent
      @click:create-entity="(payload) => emit('click:create-entity', payload)"
      @click:learn-more="(entity: string) => emit('click:learn-more', entity)"
    />
  </DynamicLayout>
</template>

<script setup lang="ts">
import { computed, provide } from 'vue'
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '@kong-ui-public/forms'
import DynamicLayout from '../../free-form/shared/layout/DynamicLayout.vue'
import StringField from '../../free-form/shared/StringField.vue'
import IdentityRealmsField from '../../free-form/plugins/key-auth/IdentityRealmsField.vue'
import ConfigFormContent from './ConfigFormContent.vue'
import { FORM_EDITING } from '../../free-form/shared/const'

import type { PluginFormLayoutProps as Props } from '../../free-form/shared/layout/provider'
import type { FieldRenderer, RenderRules } from '../../free-form/shared/types'
import type { EntityCreateEvent } from '../../../types'

// Union of the rules for every plugin rendered through this form (basic-auth, key-auth).
// Rules whose paths aren't in the current plugin's schema simply never apply.
const RENDER_RULES: RenderRules = {
  dependencies: {
    // basic-auth
    'config.brute_force_protection.redis': ['config.brute_force_protection.strategy', 'redis'],
  },
}

const FIELD_RENDERERS: FieldRenderer[] = [
  // key-auth
  {
    match: 'config.identity_realms',
    component: IdentityRealmsField,
  },
  {
    match: 'config.realm',
    component: StringField,
    propsOverrides: {
      placeholder: 'e.g., my-api',
    },
  },
  // basic-auth + key-auth
  {
    match: 'config.anonymous',
    component: StringField,
    propsOverrides: {
      placeholder: 'e.g., 00000000-0000-0000-0000-000000000001',
    },
  },
]

const props = defineProps<Props>()

const emit = defineEmits<{
  'click:learn-more': [entity: string]
  'click:create-entity': [payload: EntityCreateEvent]
}>()

const slots = defineSlots<{
  [K in typeof AUTOFILL_SLOT_NAME]: () => any
}>()

provide(AUTOFILL_SLOT, slots?.[AUTOFILL_SLOT_NAME])
provide(FORM_EDITING, computed(() => props.isEditing))
</script>
