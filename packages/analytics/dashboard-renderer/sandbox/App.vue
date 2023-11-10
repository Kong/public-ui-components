<template>
  <div class="sandbox-container">
    <main>
      <h1>Static Dashboard</h1>
      <DashboardRenderer
        :context="context"
        :definition="staticDefinition"
      />
      <h1>Dynamic Dashboard</h1>
      <DashboardRenderer
        v-if="definition.type === ValidationResultType.Success"
        :context="context"
        :definition="definition.data"
      />
      <h1>Definition</h1>
      <textarea v-model="definitionText" />
      <pre>{{ JSON.stringify(definition) }}</pre>
    </main>
  </div>
</template>

<script setup lang="ts">
import type { DashboardDefinition, DashboardRendererContext } from '../src'
import { ChartTypes, dashboardDefinitionSchema, DashboardRenderer } from '../src'
import { computed, ref } from 'vue'
import Ajv from 'ajv'
import { ChartMetricDisplay } from '@kong-ui-public/analytics-chart'

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
  data: DashboardDefinition
}

type ValidationResult = JsonParseError | ValidationError | Success

// Validation boilerplate.
// See https://github.com/ThomasAribart/json-schema-to-ts#validators
const ajv = new Ajv()

const validate = ajv.compile(dashboardDefinitionSchema)

const definitionText = ref(`{
  "tiles": [
    { "chart": {
      "type": "horizontal_bar",
     }, "query": null }
   ]
}`)

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
  filters: {},
  timeSpec: '',
}

const staticDefinition: DashboardDefinition = {
  tiles: [
    {
      title: 'Analytics chart',
      chart: {
        type: ChartTypes.HorizontalBar,
      },
      query: {},
    },
    {
      title: 'Simple chart',
      chart: {
        type: ChartTypes.Gauge,
        metricDisplay: ChartMetricDisplay.Full,
        reverseDataset: true,
        numerator: 0,
      },
      query: {},
    },
  ],
}

</script>
