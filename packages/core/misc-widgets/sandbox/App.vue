<template>
  <div class="sandbox-container">
    <main>
      <div>
        <h3>Awesome GitHub Star ⭐</h3>
        <GithubStar
          :url="url"
        />
      </div>
      <div>
        <h3>Secret Input</h3>
        <SecretInput
          v-model.trim="secret"
          label="Secret"
        />
        <pre>modelValue: {{ secret }}</pre>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const url = 'https://github.com/kong/kong'
const secret = ref('super-secret')
</script>
