<template>
  <KCard
    class="span-basic-info"
    :title="t('trace_viewer.span_basic_info.title')"
  >
    <template #actions>
      <KButton
        appearance="secondary"
        size="small"
        @click="$emit('view-logs')"
      >
        <FilterIcon />
        {{ t('trace_viewer.span_basic_info.labels.view_span_logs') }}
      </KButton>
    </template>

    <div class="info-content">
      <div class="attribute">
        <span class="label">{{ t('trace_viewer.span_basic_info.labels.name') }}</span>
        <KCopy
          v-if="name"
          badge
          :text="name"
        />
      </div>
      <div class="attribute">
        <span class="label">{{ t('trace_viewer.span_basic_info.labels.span_id') }}</span>
        <KCopy
          badge
          :text="spanId"
        />
      </div>
    </div>

    <div class="info-description">
      {{ description }}
      <KExternalLink
        class="docs-link"
        hide-icon
        href="https://docs.konghq.com/"
      >
        {{ t('trace_viewer.view_documentation') }}
      </KExternalLink>
    </div>
  </KCard>
</template>

<script setup lang="ts">
import { FilterIcon } from '@kong/icons'
import composables from '../../composables'

const { i18n: { t } } = composables.useI18n()

defineProps<{
  name?: string
  description: string
  spanId: string
}>()

defineEmits(['view-logs'])
</script>

<style lang="scss" scoped>
.span-basic-info {
  padding: $kui-space-60;

  .info-content {
    display: flex;
    gap: $kui-space-60;
    margin-bottom: $kui-space-50;

    .attribute {
      align-items: center;
      display: flex;
      gap: $kui-space-20;

      .label {
        color: $kui-color-text-neutral;
        font-size: $kui-font-size-20;
      }
    }

  }

  .info-description {
    color: $kui-color-text-neutral-strong;
    font-size: $kui-font-size-20;
    line-height: $kui-line-height-20;

    .docs-link {
      text-decoration: underline;
    }
  }

}

</style>
