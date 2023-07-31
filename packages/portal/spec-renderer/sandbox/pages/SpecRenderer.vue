<template>
  <div class="spec-renderer-sandbox">
    <main>
      <h1>✨✨ Awesome SpecRenderer ✨✨</h1>
      <div class="spec-controls">
        <h3>Try it Out:</h3>
        <label>
          <input
            v-model="essentialsOnly"
            type="checkbox"
          > essentialsOnly
        </label>
      </div>
      <br><br>
      <SpecRenderer
        :key="key"
        :essentials-only="essentialsOnly"
        :operations-list="opsList"
        :spec="defaultDocument"
        :tags="tags"
      />
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import type { Operation, Tag } from '../../src/types'
// @ts-ignore
import yamlContent from '../test.yaml'
import { SpecRenderer } from '../../src'
// only imported in Sandbox! Parent app should do this
import '@kong/kongponents/dist/style.css'

const defaultDocument = yamlContent
const opsList = ref<Operation[]>([
  {
    path: '/pet',
    method: 'put',
    operationId: 'updatePet',
    tags: ['pet'],
    summary: 'Update an existing pet',
    deprecated: false,
  },
  {
    path: '/pet',
    method: 'post',
    operationId: 'addPet',
    tags: ['pet'],
    summary: 'Add a new pet to the store',
    deprecated: false,
  },
  {
    path: '/pet',
    method: 'post',
    operationId: 'addPet',
    tags: ['pet too'],
    summary: 'Add a new pet to the store',
    deprecated: false,
  },
  {
    path: '/pet',
    method: 'get',
    operationId: 'add_a-Pet_now',
    tags: ['pet too'],
    summary: 'Add a new pet to the store with some characters in operation id',
    deprecated: false,
  },
  {
    path: '/pet/{petId}',
    method: 'get',
    operationId: 'getPetById',
    tags: ['pet'],
    summary: 'Find pet by ID',
    deprecated: false,
  },
  {
    path: '/pet/{petId}',
    method: 'put',
    operationId: 'updatePetWithForm',
    tags: ['pet'],
    summary: 'Updates a pet in the store with form data',
    deprecated: true,
  },
  {
    path: '/pet/{petId}',
    method: 'delete',
    operationId: 'deletePet',
    tags: ['pet'],
    summary: 'Deletes a pet',
    deprecated: false,
  },
  {
    path: '/pet/{petId}',
    method: 'patch',
    operationId: 'updatePet',
    tags: undefined,
    summary: 'Update an existing pet',
    deprecated: false,
  },
  {
    path: '/pet',
    method: 'options',
    operationId: 'petOptions',
    tags: undefined,
    summary: 'Get pet options',
    deprecated: false,
  },
  {
    path: '/pet',
    method: 'head',
    operationId: 'petHead',
    tags: ['pet', 'dog-go'],
    summary: 'Get pet head',
    deprecated: false,
  },
  {
    path: '/pet',
    method: 'connect',
    operationId: 'petConnect',
    tags: ['pet', 'dog-go'],
    summary: 'Get pet connect',
    deprecated: false,
  },
  {
    path: '/pet',
    method: 'trace',
    operationId: 'petTrace',
    tags: ['pet', 'other'],
    summary: 'Get pet trace',
    deprecated: false,
  },
])
const tags = ref<Tag[]>([
  {
    name: 'pet',
    description: 'Everything about your Pets',
  },
  {
    name: 'pet too',
    description: 'Everything about your Pets but with spaces',
  },
  {
    name: 'dog-go',
    description: 'This is an example of a very very ridiculously long description',
  },
  {
    name: 'other',
  },
])

// checkboxes for toggling options
const essentialsOnly = ref(false)

const key = ref(0)
watch(() => [essentialsOnly.value], () => {
  key.value++
}, { deep: true, immediate: true })
</script>

<style lang="scss" scoped>
.spec-renderer-sandbox {
  h1 {
    text-align: center;
  }

  .spec-controls {
    position: relative;
  }
}
</style>
