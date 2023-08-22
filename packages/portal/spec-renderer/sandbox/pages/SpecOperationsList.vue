<template>
  <div class="spec-operations-list-sandbox sandbox-container">
    <main>
      <div>
        <h1 class="center">
          ✨✨ Awesome SpecOperationsList ✨✨
        </h1>
        <div class="spec-controls center">
          <h3>Try it Out:</h3>
          <label>
            <input
              v-model="isFilterable"
              type="checkbox"
            > isFilterable
          </label>
          <label class="has-margin-left">
            <input
              v-model="disableSelection"
              type="checkbox"
            > disableSelection
          </label>

          <br><br>

          <KButton
            appearance="outline"
            @click="handleClear"
          >
            Clear
          </KButton>
          <KButton
            appearance="secondary"
            @click="handleReset"
          >
            Reset
          </KButton>
        </div>

        <br><br>

        <div
          class="has-padding"
          style="display: flex"
        >
          <SpecOperationsList
            :key="key"
            :disable-selection="disableSelection"
            :is-filterable="isFilterable"
            :operations="operations"
            :tags="tags"
            width="550"
            @selected="handleSelected"
          />

          <div class="has-margin-left">
            <KLabel>Spec Object:</KLabel>
            <pre class="json has-padding">{{ defaultDocument }}</pre>
          </div>

          <div class="has-margin-left">
            <KLabel>Selected Object:</KLabel>
            <pre class="json has-padding">{{ selectedItem }}</pre>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import type { Operation, Tag } from '../../src/types'
import clonedeep from 'lodash.clonedeep'
import { SpecOperationsList } from '../../src'

const defaultDocument = ref<Operation[]>([
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
    tags: [],
    summary: 'Update an existing pet',
    deprecated: false,
  },
  {
    path: '/pet',
    method: 'options',
    operationId: 'petOptions',
    tags: [],
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
const operations = ref<Operation[]>([])
const selectedItem = ref<Operation>()

// checkboxes for toggling options
const disableSelection = ref(false)
const isFilterable = ref(true)

const handleClear = (): void => {
  operations.value = []
}

const handleReset = (): void => {
  operations.value = clonedeep(defaultDocument.value)
}

const handleSelected = (item: Operation): void => {
  selectedItem.value = item
}

const key = ref(0)
watch(
  () => [isFilterable, operations, disableSelection],
  () => {
    key.value++
    selectedItem.value = undefined
  },
  { deep: true, immediate: true },
)

onMounted(() => {
  operations.value = clonedeep(defaultDocument.value)
})
</script>

<style lang="scss" scoped>
.spec-operations-list-sandbox {
  --KInputLabelSize: #{$kui-font-size-50};

  .center {
    text-align: center;
  }

  .spec-controls {
    position: relative;
  }

  .has-margin-left {
    margin-left: 12px;
  }

  pre.json {
    background-color: $kui-color-background-disabled;
    max-height: 500px;
    overflow-y: auto;
  }
}

.has-padding {
  padding: 12px;
}
</style>
