<template>
  <p>
    <slot />
  </p>
</template>

<style scoped>
p {
  margin: var(--document-viewer-paragraph-margin, 16px 0);
  line-height: var(--document-viewer-paragraph-line-height, 1.5);
}
</style>
