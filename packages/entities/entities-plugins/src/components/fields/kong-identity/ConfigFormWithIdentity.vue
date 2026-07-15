<template>
  <DynamicLayout v-bind="props">
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
import ConfigFormContent from './ConfigFormContent.vue'
import { FORM_EDITING } from '../../free-form/shared/const'

import type { PluginFormLayoutProps as Props } from '../../free-form/shared/layout/provider'
import type { EntityCreateEvent } from '../../../types'

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
