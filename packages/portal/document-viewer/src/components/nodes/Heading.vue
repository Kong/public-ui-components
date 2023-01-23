<template>
  <component :is="tag">
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
})

const tag = `h${props.level}`
</script>

<style scoped>
h1, h2, h3, h4, h5, h6 {
  font-family: var(--document-viewer-heading-font-family, var(--document-viewer-font-family));
  font-weight: var(--document-viewer-heading-font-weight, 400);
  color: var(--document-viewer-heading-color, var(--document-viewer-color));
}

h1 {
  font-size: var(--document-viewer-heading-h1-font-size, 34px);
  margin: var(--document-viewer-heading-h1-margin, 40px 0 16px);
  line-height: 1.2;
}

h2 {
  font-size: var(--document-viewer-heading-h2-font-size, 28px);
  margin: var(--document-viewer-heading-h2-margin, 32px 0 16px);
  line-height: 1.25;
}

h3 {
  font-size: var(--document-viewer-heading-h3-font-size, 24px);
  margin: var(--document-viewer-heading-h3-margin, 28px 0 16px);
  line-height: 1.3;
}

h4 {
  font-size: var(--document-viewer-heading-h4-font-size, 20px);
  margin: var(--document-viewer-heading-h4-margin, 20px 0 16px);
  line-height: 1.35;
}

h5 {
  font-size: var(--document-viewer-heading-h5-font-size, 16px);
  margin: var(--document-viewer-heading-h5-margin, 16px 0);
  line-height: 1.5;
}

h6 {
  font-size: var(--document-viewer-heading-h6-font-size, 12px);
  margin: var(--document-viewer-heading-h6-margin, 10px 0 16px);
  line-height: 1.6;
}

h1:first-child, h2:first-child, h3:first-child, h4:first-child, h5:first-child, h6:first-child {
  margin-top: 0;
}
</style>
