<template>
  <div class="spec-renderer-mini-sandbox sandbox-container">
    <main>
      <div>
        <h1 class="center">
          ✨✨ Awesome SpecRendererMini ✨✨
        </h1>
        <div class="spec-controls center">
          <h3>Try it Out:</h3>
          <label>
            <input
              v-model="isSummary"
              name="view"
              type="checkbox"
            > isSummary
          </label>

          <br><br>

          <KButton
            appearance="outline"
            class="mr-2"
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

        <div class="d-flex pa-3">
          <SpecRendererMini
            :key="key"
            :is-summary="isSummary"
            :spec="spec"
            :tags="tags"
            :width="isSummary ? '550' : '350'"
            @selected="handleSelected"
          />

          <div class="ml-3">
            <KLabel>Spec Object:</KLabel>
            <pre class="json pa-3">
              {{ defaultDocument }}
            </pre>
          </div>

          <div class="ml-3">
            <KLabel>Selected Object:</KLabel>
            <pre class="json pa-3">
              {{ selectedItem }}
            </pre>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { SpecItemType, SpecTag } from '../src/types'
import { KButton, KLabel } from '@kong/kongponents'
import SpecRendererMini from '../src'

const defaultDocument = ref<SpecItemType[]>([
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
const tags = ref<SpecTag[]>([
  {
    name: 'pet',
    description: 'Everything about your Pets',
  },
  {
    name: 'dog-go',
    description: 'This is an example of a very very ridiculously long description',
  },
  {
    name: 'other',
  },
])
const spec = ref<SpecItemType[]>([])
const selectedItem = ref<SpecItemType>()

// checkboxes for toggling options
const isSummary = ref(false)

const handleClear = (): void => {
  spec.value = []
}

const handleReset = (): void => {
  spec.value = cloneDeep(defaultDocument.value)
}

const handleSelected = (item: SpecItemType): void => {
  selectedItem.value = item
}

// TODO: import from shared?
const cloneDeep = (obj: any) => {
  if (!obj) {
    return
  }

  return JSON.parse(JSON.stringify(obj))
}

const key = ref(0)
watch(() => [isSummary.value, spec.value],
  () => {
    key.value++
    selectedItem.value = undefined
  },
  { deep: true, immediate: true },
)

onMounted(() => {
  spec.value = cloneDeep(defaultDocument.value)
})
</script>

<style lang="scss" scoped>
.spec-renderer-mini-sandbox {
  --KInputLabelSize: var(--type-lg);

  .center {
    text-align: center;
  }

  .spec-controls {
    position: relative;
  }

  pre.json {
    background-color: var(--grey-200);
    max-height: 500px;
    overflow-y: auto;
  }
}
</style>
