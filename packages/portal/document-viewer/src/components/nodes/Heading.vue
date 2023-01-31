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
  color: var(--document-viewer-color, var(--text_colors-headings, #0b172d));
  font-family: var(--font-family-sans, var(--document-viewer-font-family));
  font-weight: var(--document-viewer-heading-font-weight, 500);
  margin-top: 0;
}

h1 {
  font-size: 32px;
  font-weight: 500;
  line-height: 38px;
  margin-bottom: var(--spacing-xxl, 48px);
}

h2 {
  font-size: 24px;
  line-height: 20px;
  margin-bottom: var(--spacing-lg, 24px);
}

h3 {
  font-size: 20px;
  line-height: 20px;
  margin-bottom: var(--spacing-sm, 12px);
}

h4 {
  font-size: 18px;
  line-height: 20px;
  margin-bottom: var(--spacing-sm, 12px);
}

h5 {
  font-size: 16px;
  line-height: 20px;
  margin-bottom: var(--spacing-sm, 12px);
}

h6 {
  font-size: 14.5px;
  line-height: 20px;
  margin-bottom: var(--spacing-sm, 12px);
}

h1:first-child, h2:first-child, h3:first-child, h4:first-child, h5:first-child, h6:first-child {
  margin-top: 0;
}
</style>
