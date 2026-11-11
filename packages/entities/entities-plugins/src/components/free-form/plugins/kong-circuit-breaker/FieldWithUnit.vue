<template>
  <div class="cb-field-with-unit">
    <div class="cb-field-with-unit-control">
      <slot />
    </div>
    <div class="cb-field-with-unit-label">
      {{ unit }}
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Renders a unit suffix ("seconds", "%", …) to the right of a numeric field's
 * input, the way the Gateway's circuit breaker form shows them. The suffix is
 * decorative; the accessible name stays on the field's own label.
 */
defineProps<{ unit: string }>()
</script>

<style lang="scss" scoped>
.cb-field-with-unit {
  align-items: flex-end;
  display: flex;
  flex-direction: row;
  gap: var(--kui-space-40, $kui-space-40);

  &-control {
    flex: 1 1 0;
    min-width: 0;
  }

  &-label {
    color: var(--kui-color-text, $kui-color-text);
    // Keeps the suffix on the input's baseline, below the field label row.
    padding-bottom: var(--kui-space-20, $kui-space-20);
    white-space: nowrap;
  }
}
</style>
