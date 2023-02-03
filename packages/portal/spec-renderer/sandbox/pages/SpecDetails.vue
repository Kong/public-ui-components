<template>
  <div class="spec-details-sandbox sandbox-container">
    <main>
      <div>
        <h1>✨✨ Awesome SpecDetails ✨✨</h1>
        <div class="spec-controls">
          <h3>Try it Out:</h3>
          <div class="component-props">
            <div class="component-prop">
              <label>
                <input
                  v-model="hasSidebar"
                  type="checkbox"
                > hasSidebar
              </label>
            </div>
            <div class="component-prop">
              <label>
                <input
                  v-model="essentialsOnly"
                  type="checkbox"
                > essentialsOnly
              </label>
            </div>
            <div class="component-prop">
              <label for="activeOperationInput">Active Operation Object</label>
              <textarea
                id="activeOperationInput"
                v-model="tempActiveOperation"
              />
              <div>
                <button @click="updateActiveOperation">
                  Update
                </button>
                <button @click="insertExampleActiveOperation">
                  Insert example
                </button>
              </div>
            </div>
          </div>
        </div>
        <SpecDetails
          :key="key"
          :active-operation="activeOperation ?? undefined"
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
import yamlContent from '../test.yaml'
import type { OperationListItem } from '../../src/types'
import { SpecDetails } from '../../src'

const defaultDocument = yamlContent

// checkboxes for toggling options
const hasSidebar = ref<boolean>(true)
const essentialsOnly = ref<boolean>(false)
const activeOperation = ref<OperationListItem | null>(null)
const tempActiveOperation = ref<string>('')

function updateActiveOperation() {
  try {
    const operation = JSON.parse(tempActiveOperation.value)

    if (!Object.hasOwn(operation, 'path') || !Object.hasOwn(operation, 'method')) {
      alert('Operation object requires "path" and "method" properties')
    }

    activeOperation.value = {
      operationId: operation.operationId ?? null,
      deprecated: operation.deprecated ?? false,
      method: operation.method,
      path: operation.path,
      tag: operation.tag ?? null,
      summary: operation.summary ?? null,
    } as OperationListItem
  } catch (err) {
    console.error(err)
  }
}

function insertExampleActiveOperation() {
  tempActiveOperation.value = JSON.stringify({
    operationId: 'updatePet',
    path: '/pet',
    method: 'post',
    tag: 'pet',
  })
}

const key = ref(0)
watch(() => [hasSidebar.value, essentialsOnly.value], () => {
  key.value++
}, { deep: true, immediate: true })
</script>

<style lang="scss" scoped>
h1 {
  text-align: center;
}

.spec-controls {
  border-bottom: 1px solid #ddd;
  margin-bottom: 20px;
  position: relative;
}

.component-props {
  display: flex;
  align-items: center;
}

.component-prop {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  padding: 0 10px;
}

textarea {
  min-height: 80px;
}
</style>
