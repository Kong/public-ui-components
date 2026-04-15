<template>
  <KModal
    :action-button-text="buttonLabel"
    data-testid="remove-links-modal"
    hide-cancel-button
    max-width="640"
    :title="heading"
    :visible="visible"
    @cancel="emit('close')"
    @proceed="emit('close')"
  >
    <i18n-t
      v-if="variant === 'konnect-managed'"
      data-testid="remove-links-msg"
      keypath="delete.konnect_managed_blocked.message"
      tag="p"
    >
      <template #count>
        <strong data-testid="remove-links-count">{{ pluginCount }}</strong>
      </template>
      <template #plugin>
        {{ t('delete.konnect_managed_blocked.plugin', { count: pluginCount }) }}
      </template>
    </i18n-t>
    <template v-else>
      {{ t('delete.warning') }}
    </template>
  </KModal>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed } from 'vue'
import composables from '../composables'

const { i18n: { t }, i18nT } = composables.useI18n()

const props = defineProps({
  visible: {
    type: Boolean,
    required: true,
  },
  variant: {
    type: String as PropType<'default' | 'konnect-managed'>,
    default: 'default',
  },
  pluginCount: {
    type: Number,
    default: 0,
  },
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const heading = computed(() =>
  props.variant === 'konnect-managed'
    ? t('delete.konnect_managed_blocked.title')
    : t('delete.title'),
)

const buttonLabel = computed(() =>
  props.variant === 'konnect-managed' ? t('actions.done') : t('actions.close'),
)

</script>
