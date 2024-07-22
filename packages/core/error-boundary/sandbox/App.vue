<template>
  <div class="sandbox-container">
    <main>
      <div class="component-container">
        <p>This simple buggy component will throw an error in the <code>onMounted</code> hook. Even though the error is unhandled, the app will continue to function even if the error is not captured.</p>
        <ErrorBoundary :tags="['parent-error-tag']">
          <ErrorBoundary
            :on-error="secondaryErrorCallbackWillNotBeTriggered"
            :tags="['secondary-error-tag']"
          >
            <ErrorBoundary
              :on-error="primaryErrorCallback"
              :tags="['tertiary-error-tag']"
            >
              <BuggyComponent
                data-testid="adam custom BuggyComponent"
                :error="true"
              />
              <template
                #fallback="{ error, context }"
              >
                <div class="fallback-error-container">
                  <p>This component has custom fallback UI</p>
                  <p><code>{{ context.componentName }}</code>: {{ error.message }}</p>
                  <p><code>data-testid</code>: {{ context.dataTestid }}</p>
                  <WarningIcon
                    color="red"
                    size="64"
                  />
                </div>
              </template>
            </ErrorBoundary>
          </ErrorBoundary>
        </ErrorBoundary>
      </div>

      <div class="component-container">
        <p>This app-crashing buggy component will throw an error inside a <code>computed</code> variable. Even though this error is <em>also</em> unhandled, the app will <b>crash</b> if the error is not captured.</p>
        <ErrorBoundary :tags="['parent-error-tag']">
          <AppCrashBuggyComponent
            data-testid="adam custom AppCrashBuggyComponent"
            :error="true"
          />
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

const primaryErrorCallback = (payload) => {
  console.log('primary error callback %o', payload.context)
}

const secondaryErrorCallbackWillNotBeTriggered = () => {
  console.log('this secondary error callback should never be called')
}
</script>

<style lang="scss" scoped>
.sandbox-container {
  max-width: 600px;
  padding: $kui-space-70;
}

.fallback-error-container {
  border: 1px solid $kui-color-border-danger;
  border-radius: $kui-border-radius-40;
  padding: $kui-space-40;
}

.component-container {
  border: 1px solid $kui-color-border-primary;
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

code {
  border: 1px solid $kui-color-border;
  border-radius: $kui-border-radius-20;
  color: $kui-color-text-neutral;
  font-family: $kui-font-family-code;
  font-size: $kui-font-size-20;
  margin: 0 $kui-space-10;
  padding: $kui-space-20 $kui-space-10;
}
</style>
