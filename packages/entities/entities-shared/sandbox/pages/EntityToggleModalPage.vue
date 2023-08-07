<template>
  <div class="sandbox-container">
    <main>
      <p>
        Current state: {{ enabled ? 'Enabled' : 'Disabled' }}
      </p>
      <KButton @click="showModal">
        Toggle State
      </KButton>
      <EntityToggleModal
        :action="enabled ? 'disable' : 'enable'"
        entity-id="route-id-1"
        entity-name="route-name-1"
        entity-type="Route"
        :on-confirm="mockConfirm"
        :visible="visible"
        @cancel="closeModal"
        @proceed="closeModal"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { EntityToggleModal } from '../../src'

const visible = ref(false)
const enabled = ref(false)

const showModal = () => {
  visible.value = true
}

const closeModal = () => {
  visible.value = false
}

const mockConfirm = async () => {
  await new Promise(resolve => {
    setTimeout(() => {
      enabled.value = !enabled.value
      resolve(null)
    }, 2000)
  })
}
</script>
