<template>
  <KSkeleton
    :card-count="cardCount"
    class="plugin-card-skeleton"
    type="card"
  >
    <template #card-header>
      <div class="plugin-card-header">
        <KSkeletonBox width="5" />
      </div>
    </template>
    <template #card-content>
      &nbsp;
    </template>
    <template #card-footer>
      <div class="plugin-card-footer">
        <hr class="plugin-card-footer-divider">
        <div class="footer-skeleton">
          <KSkeletonBox width="5" />
        </div>
      </div>
    </template>
  </KSkeleton>
</template>

<script setup lang="ts">
defineProps({
  cardCount: {
    type: Number,
    default: 1,
  },
})
</script>

<style lang="scss" scoped>
.plugin-card-skeleton {
  :deep(.skeleton-card-column) {
    width: calc(25% - $kui-space-70);
  }

  :deep(.skeleton-card-footer) {
    height: 50px;
  }

  .plugin-card-header {
    margin: $kui-space-0 $kui-space-auto;
  }

  .plugin-card-footer {
    width: 100%;

    &-divider {
      background-color: #afb7c538;
      border-color: #afb7c538;
      color: #afb7c538;
      margin: $kui-space-0 $kui-space-70;
    }

    .footer-skeleton {
      display: flex;
      justify-content: center;
    }
  }
}
</style>
