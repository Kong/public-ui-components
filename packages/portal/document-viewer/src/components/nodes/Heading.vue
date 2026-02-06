<template>
  <component
    :is="tag"
    :id="slug"
  >
    <slot />
  </component>
</template>

<script setup lang="ts">
const props = defineProps({
  level: {
    type: Number,
    validator(value: unknown): boolean {
      if (!Number.isInteger(value)) {
        return false
      }

      const num = value as number

      return num > 0 && num < 7
    },
    default: 1,
  },
  slug: {
    type: String,
    default: '',
  },
})

const slug = `${props.slug}`
const tag = `h${props.level}`
</script>

<style lang="scss" scoped>
h1, h2, h3, h4, h5, h6 {
  color: var(--kui-color-text, $kui-color-text);
  font-family: var(--kong-ui-document-viewer-font-family-headings, var(--kui-font-family-text, $kui-font-family-text));
  font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
  margin-top: var(--kui-space-0, $kui-space-0);
}

h1 {
  font-size: var(--kui-font-size-80, $kui-font-size-80);
  font-weight: var(--kui-font-weight-medium, $kui-font-weight-medium);
  line-height: var(--kui-line-height-80, $kui-line-height-80);
  margin-bottom: var(--kui-space-90, $kui-space-90);
}

h2 {
  font-size: var(--kui-font-size-70, $kui-font-size-70);
  line-height: var(--kui-line-height-70, $kui-line-height-70);
  margin-bottom: var(--kui-space-80, $kui-space-80);
}

h3 {
  font-size: var(--kui-font-size-60, $kui-font-size-60);
  line-height: var(--kui-line-height-60, $kui-line-height-60);
  margin-bottom: var(--kui-space-50, $kui-space-50);
}

h4 {
  font-size: var(--kui-font-size-50, $kui-font-size-50);
  line-height: var(--kui-line-height-50, $kui-line-height-50);
  margin-bottom: var(--kui-space-50, $kui-space-50);
}

h5 {
  font-size: var(--kui-font-size-40, $kui-font-size-40);
  line-height: var(--kui-line-height-40, $kui-line-height-40);
  margin-bottom: var(--kui-space-50, $kui-space-50);
}

h6 {
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  line-height: var(--kui-line-height-30, $kui-line-height-30);
  margin-bottom: var(--kui-space-50, $kui-space-50);
}

h1:first-child, h2:first-child, h3:first-child, h4:first-child, h5:first-child, h6:first-child {
  margin-top: var(--kui-space-0, $kui-space-0);
}
</style>
