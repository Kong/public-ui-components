<template>
  <div class="sandbox-container">
    <main>
      <p>This is the component sandbox.</p>
      <VueFormGenerator
        :model="model"
        :schema="schema"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { VueFormGenerator } from '../src'
import schema from './schema.json'
import model from './model.json'
</script>
