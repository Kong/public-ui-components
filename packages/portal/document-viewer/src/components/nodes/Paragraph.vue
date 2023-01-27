<template>
  <p>
    <slot />
  </p>
</template>

<style scoped>
p {
  line-height: var(--document-viewer-paragraph-line-height, 1.5);
  margin: var(--document-viewer-paragraph-margin, 16px 0);
}
</style>
