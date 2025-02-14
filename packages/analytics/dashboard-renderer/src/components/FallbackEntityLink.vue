<template>
  <div
    class="fallback-entity-link"
    data-testid="entity-link-parent"
  >
    {{ entityLinkData.label }}
  </div>
</template>
<script setup lang="ts">

defineProps<{
  entityLinkData: { label?: string },
}>()

</script>
