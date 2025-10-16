<template>
  <div class="sandbox-container">
    <main>
      <div>
        <h3>Awesome GitHub Star ⭐</h3>
        <GithubStar
          :url="url"
        />
        <h3>New Badge</h3>
        <div class="badge-wrapper">
          <NewBadge />
          <NewBadge inverse />
          <NewBadge large />
          <NewBadge
            inverse
            large
          />
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import NewBadge from '../src/components/NewBadge.vue'

const url = 'https://github.com/kong/kong'
</script>

<style lang="scss" scoped>
.sandbox-container {
  .badge-wrapper {
    display: flex;
    gap: 10px;
    align-items: flex-end;
  }
}
</style>
