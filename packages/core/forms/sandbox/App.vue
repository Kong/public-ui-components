<template>
  <div class="sandbox-container">
    <main>
      <p>This is the component sandbox.</p>
      <VueFormGenerator
        :model="mutableModel"
        :schema="schema"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import schema from './schema.json'
import model from './model.json'

const mutableModel = ref(model)
</script>
