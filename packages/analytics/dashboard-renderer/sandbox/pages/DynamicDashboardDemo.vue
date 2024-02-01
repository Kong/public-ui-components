<template>
  <SandboxLayout
    :links="appLinks"
    title="Dashboard Renderer"
  >
    <template #controls>
      <h2>Definition</h2>
      <textarea v-model="definitionText" />
      <KCodeBlock
        id="data-codeblock"
        :code="JSON.stringify(definition, null, 2)"
        is-searchable
        language="json"
      />
    </template>
    <div class="sandbox-container">
      <DashboardRenderer
        v-if="definition.type === ValidationResultType.Success"
        :config="definition.data"
        :context="context"
      />
    </div>
  </SandboxLayout>
</template>

<script setup lang="ts">
import type { DashboardConfig, DashboardRendererContext } from '../../src'
import { dashboardConfigSchema, DashboardRenderer } from '../../src'
import { computed, ref, inject } from 'vue'
import Ajv from 'ajv'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import '@kong-ui-public/sandbox-layout/dist/style.css'

const appLinks: SandboxNavigationItem[] = inject('app-links', [])

// Consider moving to its own package.
enum ValidationResultType {
  JsonParseError,
  ValidationError,
  Success,
}

interface JsonParseError {
  type: ValidationResultType.JsonParseError
  message: string
}

interface ValidationError {
  type: ValidationResultType.ValidationError,
  errors: any
}

interface Success {
  type: ValidationResultType.Success,
  data: DashboardConfig
}

type ValidationResult = JsonParseError | ValidationError | Success

// Validation boilerplate.
// See https://github.com/ThomasAribart/json-schema-to-ts#validators
const ajv = new Ajv()

const validate = ajv.compile(dashboardConfigSchema)

const definitionText = ref(`{
    "gridSize": {
      "cols": 5,
      "rows": 5
    },
    "tiles": [
      {
        "definition": {
          "chart": {
            "type": "horizontal_bar"
          },
          "query": {}
        },
        "layout": {
          "position": {
            "col": 0,
            "row": 0
          },
          "size": {
            "cols": 2,
            "rows": 2
          }
        }
      },
      {
        "definition": {
          "chart": {
            "type": "vertical_bar"
          },
          "query": {}
        },
        "layout": {
          "position": {
            "col": 0,
            "row": 2
          },
          "size": {
            "cols": 2,
            "rows": 2
          }
        }
      }
    ]
  }`,
)

const definition = computed<ValidationResult>(() => {
  let data

  try {
    data = JSON.parse(definitionText.value)
  } catch (e) {
    return {
      type: ValidationResultType.JsonParseError,
      message: `${e}`,
    }
  }

  if (!validate(data)) {
    return {
      type: ValidationResultType.ValidationError,
      errors: validate.errors,
    }
  }

  return {
    type: ValidationResultType.Success,
    data,
  }
})

const context: DashboardRendererContext = {
  filters: [],
  timeSpec: {
    type: 'relative',
    time_range: '24h',
  },
}

</script>

<style lang="scss" scoped>
  textarea {
    background-color: $kui-color-background-neutral-weakest;
    border: 1px solid $kui-color-background-neutral-weak;
    border-radius: 4px;
    color: #333333;
    font-family: 'Fira Code', 'Consolas', 'Monaco', monospace;
    font-size: $kui-font-size-20;
    height: 500px;
    line-height: 1.5;
    margin: 1rem 0;
    overflow: auto;
    padding: 1rem;
    resize: vertical;
    scrollbar-color: #bbbbbb #e0e0e0;
    scrollbar-width: thin;
    tab-size: 4;
    -moz-tab-size: 4;
    width: 90%;
  }

  textarea::-webkit-scrollbar {
    width: 5px;
  }

  textarea::-webkit-scrollbar-track {
    background: #e0e0e0;
    border-radius: 10px;
  }

  textarea::-webkit-scrollbar-thumb {
    background-color: #bbbbbb;
    border: 1px solid #aaaaaa;
    border-radius: 10px;
  }

  textarea:focus {
    border-color: white;
    box-shadow: 0 0 0 2px $kui-color-background-neutral-weak;
    outline: none;
  }
</style>
