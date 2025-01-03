<template>
  <KCard class="span-basic-info">
    <div>
      <span class="label">{{ name }}:</span> <span>{{ description }}</span>
    </div>

    <KExternalLink
      class="docs-link"
      hide-icon
      href="https://docs.konghq.com/"
    >
      {{ t('trace_viewer.view_documentation') }}
    </KExternalLink>
  </KCard>
</template>

<script setup lang="ts">
import composables from '../../composables'

const { i18n: { t } } = composables.useI18n()

defineProps<{
  name: string
  description: string
}>()
</script>

<style lang="scss" scoped>
.span-basic-info {
  padding: $kui-space-60;

  .label {
    font-weight: $kui-font-weight-semibold;
  }
}

.docs-link {
  align-self: flex-end;
  margin-top: $kui-space-40;
}
</style>
