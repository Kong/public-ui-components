<template>
  <KCard>
    <p class="span-description">
      <span class="name">
        {{ span.name }}:
      </span>
      <span :class="['description', { 'not-available': !description }]">
        {{ description || t('trace_viewer.no_span_description') }}
      </span>
    </p>

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
import { getPhaseAndPlugin } from '../../utils'
import composables from '../../composables'
import type { SpanNode } from '../../types'
import { computed } from 'vue'

const { i18n: { t } } = composables.useI18n()

const props = defineProps<{ span: SpanNode['span'] }>()

const description = computed(() => {
  const pluginSpan = getPhaseAndPlugin(props.span.name)
  // We will use general description for plugin spans that exactly match `kong.(phase).plugin.(plugin)`.
  const subI18nKey = pluginSpan && !pluginSpan.suffix ? `kong.${pluginSpan.phase}.plugin` : props.span.name
  const i18nKey = `trace_viewer.span_descriptions.${subI18nKey}`
  const localizedString = t(i18nKey as any)
  return i18nKey !== localizedString && localizedString ? localizedString : undefined
})
</script>

<style lang="scss" scoped>
.span-description {
  margin: 0;

  .name {
    font-weight: $kui-font-weight-semibold;
  }

  .description.not-available {
    font-style: italic;
  }
}

.docs-link {
  align-self: flex-end;
}
</style>
