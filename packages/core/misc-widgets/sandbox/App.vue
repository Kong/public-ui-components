<template>
  <div class="sandbox-container">
    <main>
      <div>
        <h3>Awesome GitHub Star ⭐</h3>
        <GithubStar :url="url" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
const url = 'https://github.com/kong/kong'
</script>
