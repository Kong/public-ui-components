<template>
  <div class="sandbox-container">
    <main>
      <KButton
        @click="showModal"
      >
        Show Modal
      </KButton>
      <EntityDeleteModal
        :action-pending="loading"
        description="Deleting this route will also remove any associated plugins. This action cannot be reversed."
        entity-name="route-1"
        :entity-type="EntityTypes.Route"
        title="Delete a Route"
        :visible="visible"
        @cancel="cancel"
        @proceed="mockDelete"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { EntityDeleteModal, EntityTypes } from '../../src'

const visible = ref(false)
const loading = ref(false)

const showModal = () => {
  visible.value = true
}

const cancel = () => {
  visible.value = false
}

const mockDelete = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    visible.value = false
  }, 1000)
}
</script>
