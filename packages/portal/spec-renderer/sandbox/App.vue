<template>
  <div class="spec-renderer-sandbox sandbox-container">
    <main>
      <div>
        <h1>✨✨ Awesome SpecRenderer ✨✨</h1>
        <div
          class="spec-controls"
          :class="{
            'has-sidebar': hasSidebar
          }"
        >
          <h3>Try it Out:</h3>
          <label>
            <input
              v-model="hasSidebar"
              type="checkbox"
            > hasSidebar
          </label>
          <label class="ml-3">
            <input
              v-model="essentialsOnly"
              type="checkbox"
            > essentialsOnly
          </label>
        </div>
        <SpecRenderer
          :key="key"
          :document="defaultDocument"
          :essentials-only="essentialsOnly"
          :has-sidebar="hasSidebar"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
// @ts-ignore
import yamlContent from './test.yaml'
import SpecRenderer from '../src'

const defaultDocument = yamlContent

// checkboxes for toggling options
const hasSidebar = ref(true)
const essentialsOnly = ref(false)

const key = ref(0)
watch(() => [hasSidebar.value, essentialsOnly.value], () => {
  key.value++
}, { deep: true, immediate: true })
</script>

<style lang="scss" scoped>
.spec-renderer-sandbox {
  --sidebar-width: 250px;

  h1 {
    text-align: center;
  }

  .spec-controls {
    position: relative;

    &.has-sidebar {
      left: calc(var(--sidebar-width) + 50px);
    }
  }

  .ml-3 {
    margin-left: 16px;
  }
}
</style>
