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
/* stylelint-disable @kong/design-tokens/token-var-usage */
h1, h2, h3, h4, h5, h6 {
  color: var(--kong-ui-document-viewer-color, $kui-color-text);
  font-family: var(--kong-ui-document-viewer-font-family-headings, var(--kong-ui-document-viewer-font-family-default, $kui-font-family-text));
  font-weight: var(--kong-ui-document-viewer-heading-font-weight, $kui-font-weight-medium);
  margin-top: $kui-space-0;
}

h1 {
  font-size: $kui-font-size-80;
  font-weight: $kui-font-weight-medium;
  line-height: $kui-line-height-80;
  margin-bottom: $kui-space-90;
}

h2 {
  font-size: $kui-font-size-70;
  line-height: $kui-line-height-70;
  margin-bottom: $kui-space-80;
}

h3 {
  font-size: $kui-font-size-60;
  line-height: $kui-line-height-60;
  margin-bottom: $kui-space-50;
}

h4 {
  font-size: $kui-font-size-50;
  line-height: $kui-line-height-50;
  margin-bottom: $kui-space-50;
}

h5 {
  font-size: $kui-font-size-40;
  line-height: $kui-line-height-40;
  margin-bottom: $kui-space-50;
}

h6 {
  font-size: $kui-font-size-30;
  line-height: $kui-line-height-30;
  margin-bottom: $kui-space-50;
}

h1:first-child, h2:first-child, h3:first-child, h4:first-child, h5:first-child, h6:first-child {
  margin-top: $kui-space-0;
}
</style>
