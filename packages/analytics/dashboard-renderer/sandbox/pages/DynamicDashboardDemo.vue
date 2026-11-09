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
        language="json"
        searchable
      />
    </template>
    <div class="sandbox-container">
      <DashboardRenderer
        v-if="definition.type === ValidationResultType.Success"
        v-model="definition.data"
        :context="context"
      />
    </div>
  </SandboxLayout>
</template>

<script setup lang="ts">
import type { DashboardRendererContext } from '../../src'
import { DashboardRenderer } from '../../src'
import { computed, ref, inject } from 'vue'
import Ajv from 'ajv'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import '@kong-ui-public/sandbox-layout/dist/style.css'
import { type DashboardConfig, dashboardConfigSchema } from '@kong-ui-public/analytics-utilities'

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
  type: ValidationResultType.ValidationError
  errors: any
}

interface Success {
  type: ValidationResultType.Success
  data: DashboardConfig
}

type ValidationResult = JsonParseError | ValidationError | Success

// Validation boilerplate.
// See https://github.com/ThomasAribart/json-schema-to-ts#validators
const ajv = new Ajv()

const validate = ajv.compile(dashboardConfigSchema)

const definitionText = ref(
  `
{
    "tiles": [
      {
        "type": "chart",
        "definition": {
          "chart": {
            "type": "horizontal_bar"
          },
          "query": {
            "datasource": "api_usage"
          }
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
        "type": "chart",
        "definition": {
          "chart": {
            "type": "horizontal_bar"
          },
          "query": {
            "datasource": "api_usage"
          }
        },
        "layout": {
          "position": {
            "col": 2,
            "row": 0
          },
          "size": {
            "cols": 2,
            "rows": 2
          }
        }
      },
      {
        "type": "chart",
        "definition": {
          "chart": {
            "type": "vertical_bar"
          },
          "query": {
            "datasource": "api_usage"
          }
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
      },
      {
        "type": "chart",
        "definition": {
          "chart": {
            "type": "timeseries_line",
            "chart_dataset_colors": {
              "request_count": "#00C8F4"
            },
            "chart_title": "Traffic",
            "synthetics_data_key": "overview-traffic"
          },
          "query": {
            "datasource": "api_usage"
          }
        },
        "layout": {
          "position": {
            "col": 2,
            "row": 2
          },
          "size": {
            "cols": 4,
            "rows": 2
          }
        }
      }
    ]
  }
  `,
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
  editable: true,
}

</script>

<style lang="scss" scoped>
textarea {
  background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  color: var(--kui-color-text, $kui-color-text);
  font-family: var(--kui-font-family-code, $kui-font-family-code);
  font-size: var(--kui-font-size-20, $kui-font-size-20);
  height: 500px;
  line-height: var(--kui-line-height-30, $kui-line-height-30);
  margin: var(--kui-space-60, $kui-space-60) 0;
  overflow: auto;
  padding: var(--kui-space-60, $kui-space-60);
  resize: vertical;
  scrollbar-color: var(--kui-color-border-neutral-weak, $kui-color-border-neutral-weak) transparent;
  scrollbar-width: thin;
  -moz-tab-size: 4;
  tab-size: 4;
  width: 90%;
}

textarea:focus {
  border-color: var(--kui-color-border-primary, $kui-color-border-primary);
  box-shadow: var(--kui-shadow-focus, $kui-shadow-focus);
  outline: none;
}
</style>
