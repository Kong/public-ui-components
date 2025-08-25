<template>
  <KCard>
    <KEmptyState
      data-testid="dashboard-empty-state"
      icon-background
      :message="message"
      :title="i18n.t('empty_tile.title')"
    >
      <template #icon>
        <AddChartIcon decorative />
      </template>

      <template #action>
        <KButton
          appearance="secondary"
          :disabled="!canAddTile"
          @click.prevent="$emit('add-tile')"
        >
          <AddIcon decorative />
          {{ i18n.t('empty_tile.add') }}
        </KButton>
      </template>
    </KEmptyState>
  </KCard>
</template>

<script setup lang="ts">
import { AddIcon, AddChartIcon } from '@kong/icons'
import composables from '../composables'

withDefaults(defineProps<{
  canAddTile?: boolean
  message?: string
}>(), {
  canAddTile: true,
  message: undefined,
})

const { i18n } = composables.useI18n()

defineEmits<{
  (e: 'add-tile'): void
}>()
</script>
