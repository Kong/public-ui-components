<template>
  <KModal
    action-button-text="Apply"
    cancel-button-text="Cancel"
    :max-height="'90vh'"
    :max-width="'90vw'"
    :visible="visible"
    @cancel="handleCancel"
    @proceed="handleApply"
  >
    <template #title>
      <div class="jq-playground-title">
        <span>JQ Playground</span>
        <KSelect
          :items="exampleMenuItems"
          :model-value="selectedExample"
          placeholder="Load Example"
          width="200"
          @change="handleExampleSelect"
        />
      </div>
    </template>
    <div class="jq-playground-modal">
      <div class="jq-playground-layout">
        <!-- Left side with input editors -->
        <div class="jq-playground-left">
          <!-- JSON Input Editor -->
          <div class="jq-playground-section">
            <KLabel>JSON Input</KLabel>
            <div
              ref="jsonEditorRef"
              class="jq-playground-editor"
            />
          </div>

          <!-- JQ Script Editor -->
          <div class="jq-playground-section">
            <KLabel>JQ Script</KLabel>
            <div
              ref="jqEditorRef"
              class="jq-playground-editor"
            />
          </div>
        </div>

        <!-- Right side with output -->
        <div class="jq-playground-right">
          <KLabel>Output</KLabel>
          <div class="jq-playground-output">
            <KCodeBlock
              v-if="output"
              id="jq-playground-output"
              :code="output"
              language="json"
              :max-height="'400px'"
              theme="light"
            />
            <div
              v-else-if="error"
              class="jq-playground-error"
            >
              <KAlert appearance="danger">
                <div class="error-message">
                  <strong>Error:</strong> {{ error }}
                </div>
              </KAlert>
            </div>
            <div
              v-else
              class="jq-playground-empty"
            >
              <KEmptyState
                icon-variant="search"
                message="Enter JSON input and JQ script to see the output"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  </KModal>
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'
import { KModal, KLabel, KCodeBlock, KAlert, KEmptyState, KSelect } from '@kong/kongponents'
import * as monaco from 'monaco-editor'
import { evaluate, parse } from '@jq-tools/jq'

interface Props {
  visible: boolean
  initialJqScript?: string
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'update-jq-script', script: string): void
}

const props = withDefaults(defineProps<Props>(), {
  initialJqScript: '',
})

const emit = defineEmits<Emits>()

// Editor refs
const jsonEditorRef = ref<HTMLElement>()
const jqEditorRef = ref<HTMLElement>()

// Monaco editor instances
let jsonEditor: monaco.editor.IStandaloneCodeEditor | null = null
let jqEditor: monaco.editor.IStandaloneCodeEditor | null = null

// Reactive state
const jsonInput = ref('{\n  "message": "Hello, World!",\n  "items": [1, 2, 3, 4, 5],\n  "nested": {\n    "key": "value"\n  }\n}')
const jqScript = ref(props.initialJqScript || '.')
const output = ref('')
const error = ref('')
const selectedExample = ref('')

// Example data
const examples = [
  {
    id: 'basic-filter',
    label: 'Basic Filtering',
    json: `{
  "users": [
    { "name": "Alice", "age": 30, "active": true },
    { "name": "Bob", "age": 25, "active": false },
    { "name": "Charlie", "age": 35, "active": true }
  ]
}`,
    jq: '.users[] | select(.active == true) | .name',
  },
  {
    id: 'array-manipulation',
    label: 'Array Manipulation',
    json: `{
  "numbers": [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
  "metadata": {
    "source": "test-data",
    "version": "1.0"
  }
}`,
    jq: '.numbers | map(select(. % 2 == 0)) | { even_numbers: ., count: length }',
  },
  {
    id: 'nested-extraction',
    label: 'Nested Data Extraction',
    json: `{
  "products": [
    {
      "id": 1,
      "name": "Laptop",
      "price": 999.99,
      "specs": {
        "cpu": "Intel i7",
        "ram": "16GB",
        "storage": "512GB SSD"
      }
    },
    {
      "id": 2,
      "name": "Phone",
      "price": 599.99,
      "specs": {
        "cpu": "Snapdragon 888",
        "ram": "8GB",
        "storage": "128GB"
      }
    }
  ]
}`,
    jq: '.products | map({ name, price, cpu: .specs.cpu }) | sort_by(.price)',
  },
]

const exampleMenuItems = examples.map(example => ({
  label: example.label,
  value: example.id,
}))

// Watch for external changes to initialJqScript
watch(() => props.initialJqScript, (newScript) => {
  if (newScript !== undefined && newScript !== jqScript.value) {
    jqScript.value = newScript
    if (jqEditor) {
      jqEditor.setValue(newScript)
    }
  }
})

// Monaco editor options
const editorOptions: monaco.editor.IStandaloneEditorConstructionOptions = {
  automaticLayout: true,
  fixedOverflowWidgets: true,
  fontSize: 14,
  lineHeight: 22,
  lineNumbersMinChars: 3,
  lineDecorationsWidth: 2,
  minimap: {
    enabled: false,
  },
  renderValidationDecorations: 'editable',
  overviewRulerLanes: 0,
  renderLineHighlightOnlyWhenFocus: true,
  scrollBeyondLastLine: false,
  theme: 'vs',
}

// Initialize editors when modal becomes visible
watch(() => props.visible, (visible) => {
  if (visible) {
    setTimeout(initializeEditors, 100)
  } else {
    disposeEditors()
  }
})

function initializeEditors() {
  if (!jsonEditorRef.value || !jqEditorRef.value) return

  // Create JSON editor
  jsonEditor = monaco.editor.create(jsonEditorRef.value, {
    ...editorOptions,
    language: 'json',
    value: jsonInput.value,
  })

  // Create JQ editor
  jqEditor = monaco.editor.create(jqEditorRef.value, {
    ...editorOptions,
    language: 'plaintext',
    value: jqScript.value,
  })

  // Listen for changes
  jsonEditor.onDidChangeModelContent(() => {
    jsonInput.value = jsonEditor?.getValue() || ''
    processJq()
  })

  jqEditor.onDidChangeModelContent(() => {
    const newValue = jqEditor?.getValue() || ''
    jqScript.value = newValue
    // Emit the change immediately for real-time sync
    emit('update-jq-script', newValue)
    processJq()
  })

  // Initial processing
  processJq()
}

function disposeEditors() {
  jsonEditor?.dispose()
  jqEditor?.dispose()
  jsonEditor = null
  jqEditor = null
}

// JQ processing using @jq-tools/jq
async function processJq() {
  try {
    // Basic validation of JSON input
    const parsedJson = JSON.parse(jsonInput.value)

    // Use @jq-tools/jq to process the JSON with the JQ script
    const result = evaluate(parse(jqScript.value), [parsedJson])

    // Format the output
    if (typeof result === 'string') {
      output.value = result
    } else {
      output.value = JSON.stringify(Array.from(result)[0], null, 2)
    }

    error.value = ''
  } catch (e) {
    // Handle both JSON parsing errors and JQ script errors
    if (e instanceof SyntaxError && jsonInput.value.trim()) {
      error.value = `Invalid JSON: ${e.message}`
    } else if (e instanceof Error) {
      error.value = `JQ Error: ${e.message}`
    } else {
      error.value = 'Unknown error occurred'
    }
    output.value = ''
  }
}

function handleCancel() {
  selectedExample.value = ''
  emit('update:visible', false)
}

function handleApply() {
  selectedExample.value = ''
  emit('update-jq-script', jqScript.value)
  emit('update:visible', false)
}

function handleExampleSelect(item: { label: string, value: string } | null) {
  if (!item) return

  console.log('Selected example:', item)
  const example = examples.find(ex => ex.id === item.value)
  if (!example) return

  // Update selected state
  selectedExample.value = item.value

  // Update reactive state
  jsonInput.value = example.json
  jqScript.value = example.jq

  // Update editors if they exist
  if (jsonEditor) {
    jsonEditor.setValue(example.json)
  }
  if (jqEditor) {
    jqEditor.setValue(example.jq)
  }

  // Process the new JQ script
  processJq()
}

// Cleanup on unmount
onBeforeUnmount(() => {
  disposeEditors()
})
</script>

<style lang="scss" scoped>
.jq-playground-title {
  align-items: center;
  display: flex;
  justify-content: space-between;
  padding-right: $kui-space-40;
  width: 100%;

  span {
    font-size: $kui-font-size-50;
    font-weight: $kui-font-weight-semibold;
  }
}

.jq-playground-modal {
  .jq-playground-layout {
    display: grid;
    gap: $kui-space-60;
    grid-template-columns: 1fr 1fr;
    height: 70vh;
    min-height: 500px;
  }

  .jq-playground-left {
    display: flex;
    flex-direction: column;
    gap: $kui-space-50;
  }

  .jq-playground-right {
    display: flex;
    flex-direction: column;
    gap: $kui-space-50;
  }

  .jq-playground-section {
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: $kui-space-30;
  }

  .jq-playground-editor {
    border: $kui-border-width-10 solid $kui-color-border;
    border-radius: $kui-border-radius-20;
    height: 100%;
    min-height: 200px;
    overflow: hidden;
  }

  .jq-playground-output {
    display: flex;
    flex: 1;
    flex-direction: column;

    :deep(.k-code-block) {
      flex: 1;
      height: 100%;
    }
  }

  .jq-playground-error {
    .error-message {
      font-family: $kui-font-family-code;
      font-size: $kui-font-size-30;
    }
  }

  .jq-playground-empty {
    align-items: center;
    background-color: $kui-color-background-neutral-weakest;
    border: $kui-border-width-10 solid $kui-color-border;
    border-radius: $kui-border-radius-20;
    display: flex;
    flex: 1;
    justify-content: center;
  }
}
</style>
