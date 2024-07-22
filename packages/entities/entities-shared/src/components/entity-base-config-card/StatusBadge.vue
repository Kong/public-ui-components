<template>
  <KBadge :appearance="status ? 'success' : 'neutral'">
    {{ status ? t('baseConfigCard.statusBadge.enabledLabel') : t('baseConfigCard.statusBadge.disabledLabel') }}
  </KBadge>
</template>

<script setup lang="ts">
import composables from '../../composables'

defineProps({
  status: {
    type: Boolean,
    default: false,
  },
})

const { i18n: { t } } = composables.useI18n()
</script>
