<template>
  <div class="sandbox-container">
    <main>
      <div class="component-container">
        <p>This simple buggy component will throw an error in the <code>onMounted</code> hook. Even though the error is unhandled, the app will continue to function even if the error is not captured.</p>
        <ErrorBoundary>
          <BuggyComponent :error="true" />
        </ErrorBoundary>
      </div>

      <div class="component-container">
        <p>This app-crashing buggy component will throw an error inside a <code>computed</code> variable. Even though this error is <em>also</em> unhandled, the app will <b>crash</b> if the error is not captured.</p>
        <ErrorBoundary>
          <AppCrashBuggyComponent :error="true" />
          <template #fallback>
            <p>This component has custom fallback UI</p>
            <WarningIcon
              color="red"
              size="64"
            />
          </template>
        </ErrorBoundary>
      </div>

      <hr>

      <p>Does the page still function?</p>
      <div class="button-container">
        <button @click="count++">
          Count: {{ count }}
        </button>
        <button
          :disabled="count === 0"
          @click="count = 0"
        >
          Reset count
        </button>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ErrorBoundary } from '../src'
import BuggyComponent from './components/BuggyComponent.vue'
import AppCrashBuggyComponent from './components/AppCrashBuggyComponent.vue'
import { WarningIcon } from '@kong/icons'

const count = ref<number>(0)
</script>

<style lang="scss" scoped>
.sandbox-container {
  max-width: 600px;
  padding: $kui-space-70;
}

.component-container {
  border: 1px solid $kui-color-border-neutral-weak;
  border-radius: $kui-border-radius-40;
  margin-bottom: $kui-space-70;
  padding: $kui-space-70;
}

.button-container {
  display: flex;
  gap: $kui-space-40;
}

hr {
  border: 1px solid $kui-color-background-neutral-weak;
  margin: $kui-space-70 0;
}
</style>

<style lang="scss">
html,
body {
  margin: 0;
  padding: 0;
}
</style>
