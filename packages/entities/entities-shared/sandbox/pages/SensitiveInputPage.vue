<template>
  <div class="sandbox-container">
    <section>
      <h3>Create mode (default)</h3>
      <SensitiveInput
        v-model="createValue"
        label="API key"
      />
      <pre>modelValue: {{ createValue }}</pre>
    </section>

    <section>
      <h3>Create mode with Generate key</h3>
      <SensitiveInput
        v-model="generateValue"
        :generator="generateKey"
        label="API key"
      />
      <pre>modelValue: {{ generateValue }}</pre>
    </section>

    <section>
      <h3>Edit mode (starts masked → Rotate key)</h3>
      <SensitiveInput
        v-model="editValue"
        :generator="generateKey"
        label="API key"
        mode="edit"
      />
      <pre>modelValue: {{ editValue }}</pre>
    </section>

    <section>
      <h3>Edit mode without Generate key (paste a key from a third party)</h3>
      <SensitiveInput
        v-model="editNoGenerateValue"
        label="API key"
        mode="edit"
      />
      <pre>modelValue: {{ editNoGenerateValue }}</pre>
    </section>

    <section>
      <h3>One-time hint (shown after the "generated" event fires)</h3>
      <SensitiveInput
        v-model="hintValue"
        :generator="generateKey"
        label="API key"
        :show-one-time-hint="showHint"
        @generated="showHint = true"
      />
      <pre>modelValue: {{ hintValue }}</pre>
    </section>

    <section>
      <h3>Alert slot (shown after the "rotate" event fires)</h3>
      <SensitiveInput
        v-model="rotateAlertValue"
        label="API key"
        mode="edit"
        @rotate="showRotateAlert = true"
      >
        <template #alert>
          <KAlert
            v-if="showRotateAlert"
            message="Once saved, the key value will not be visible."
          />
        </template>
      </SensitiveInput>
      <pre>modelValue: {{ rotateAlertValue }}</pre>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { SensitiveInput } from '../../src'

const createValue = ref('')
const generateValue = ref('')
const editValue = ref('')
const editNoGenerateValue = ref('')
const hintValue = ref('')
const showHint = ref(false)
const rotateAlertValue = ref('')
const showRotateAlert = ref(false)

const generateKey = (): string => {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
</script>

<style lang="scss" scoped>
.sandbox-container {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-100, $kui-space-100);
  max-width: 600px;

  section {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-40, $kui-space-40);
  }

  h3 {
    margin: 0;
  }

  pre {
    background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
    margin: 0;
    padding: var(--kui-space-40, $kui-space-40);
  }
}
</style>
