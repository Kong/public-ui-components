<template>
  <div class="editor-skeleton">
    <KSkeleton
      v-for="i in 5"
      :key="i"
    />
  </div>
</template>

<style lang="scss" scoped>
.editor-skeleton {
  margin-top: var(--kui-space-20, $kui-space-20);
}
</style>
