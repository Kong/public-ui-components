<template>
  <section
    v-for="section in sandboxAnchorSections"
    :id="section.target === 'id' ? section.key : undefined"
    :key="section.key"
    :ref="(el) => setSectionElement(section.key, el)"
    class="anchor-section"
    :data-section="section.target === 'selector' ? section.key : undefined"
  >
    <h2 class="anchor-section-title">
      {{ section.label }}
    </h2>
    <p class="anchor-section-body">
      Targeted by <code>{{ targetDescription(section) }}</code>{{ section.offset ? `, landing ${section.offset}px down the scroller` : '' }}.
    </p>
  </section>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import type { ComponentPublicInstance } from 'vue'
import { sandboxAnchorSections } from '../anchors'
import type { SandboxAnchorSection } from '../anchors'

/**
 * The section elements, by key. Only the `element`-targeted section actually needs one, but
 * collecting them all keeps the template free of a conditional ref.
 */
const sectionElements = reactive<Record<string, HTMLElement | null>>({})

const setSectionElement = (key: string, el: Element | ComponentPublicInstance | null): void => {
  sectionElements[key] = (el as HTMLElement | null) ?? null
}

const targetDescription = (section: SandboxAnchorSection): string => {
  switch (section.target) {
    case 'selector':
      return `selector: '[data-section="${section.key}"]'`
    case 'element':
      return 'element: <template ref>'
    default:
      return `selector: '#${section.key}'`
  }
}

defineExpose({ sectionElements })
</script>

<style lang="scss" scoped>
.anchor-section {
  background-color: var(--kui-color-background, $kui-color-background);
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  // Tall enough that each section can be scrolled to the top of the page on its own
  min-height: 60vh;
  padding: var(--kui-space-60, $kui-space-60);

  .anchor-section-title {
    color: var(--kui-color-text, $kui-color-text);
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    margin: var(--kui-space-0, $kui-space-0);
  }

  .anchor-section-body {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
  }
}
</style>
