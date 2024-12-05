<template>
  <KCard class="span-basic-info">
    <div class="rows">
      <div class="label">
        {{ t('trace_viewer.span_basic_info.labels.name') }}
      </div>
      <div class="value">
        {{ span.name }}
      </div>

      <template v-if="description">
        <div class="label">
          {{ t('trace_viewer.span_basic_info.labels.description') }}
        </div>
        <div class="value">
          {{ description }}
        </div>
      </template>
    </div>

    <KExternalLink
      v-if="description"
      class="docs-link"
      hide-icon
      href="https://docs.konghq.com/"
    >
      {{ t('trace_viewer.view_documentation') }}
    </KExternalLink>
  </KCard>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import composables from '../../composables'
import type { SpanNode } from '../../types'
import { getPhaseAndPlugin } from '../../utils'

const { i18n: { t, te } } = composables.useI18n()

const props = defineProps<{ span: SpanNode['span'] }>()

const description = computed(() => {
  const pluginSpan = getPhaseAndPlugin(props.span.name)
  // We will use general description for plugin spans that exactly match `kong.(phase).plugin.(plugin)`.
  const subI18nKey = pluginSpan && !pluginSpan.suffix ? `kong.${pluginSpan.phase}.plugin` : props.span.name
  const i18nKey = `trace_viewer.span_basic_info.descriptions.${subI18nKey}.$`
  return te(i18nKey as any) ? t(i18nKey as any) : undefined
})
</script>

<style lang="scss" scoped>
.span-basic-info {
  padding: $kui-space-60;

  .rows {
    display: grid;
    gap: $kui-space-20 $kui-space-40;
    grid-template-columns: min-content auto;

    .label {
      font-weight: $kui-font-weight-semibold;
    }
  }
}

.docs-link {
  align-self: flex-end;
  margin-top: $kui-space-40;
}
</style>
