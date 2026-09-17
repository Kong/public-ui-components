<template>
  <KTooltip
    class="ff-version-gate-tooltip"
    :kpop-attributes="{ 'data-testid': dataTestid }"
    max-width="400px"
    :text="versionInfo?.tooltip ?? ''"
  >
    <slot />
  </KTooltip>
</template>

<script setup lang="ts">
import { KTooltip } from '@kong/kongponents'
import type { VersionInfo } from '../composables/schema'

defineProps<{
  /** `undefined` renders as a plain (empty-text) passthrough — no tooltip, no wrapping overhead. */
  versionInfo?: VersionInfo
  dataTestid?: string
}>()
</script>

<style lang="scss" scoped>
// KPop's trigger wrapper is 100% of `.k-popover`, but `.k-popover` itself has
// no width of its own — it collapses to 0 as a flex item, taking the wrapped
// (possibly disabled) field down with it. Give it real width to stretch into.
// Scoped to our own class, not `.k-popover` in general, since the slotted
// content may itself contain unrelated (content-sized) tooltips, e.g. a
// field's own description-info-icon tooltip.
:deep(.ff-version-gate-tooltip.k-popover) {
  width: 100%;
}

.ff-version-gate-tooltip :deep(.popover-trigger-wrapper) {
  display: block;
}
</style>
