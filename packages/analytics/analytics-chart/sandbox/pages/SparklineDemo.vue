<template>
  <SandboxLayout
    :links="appLinks"
    title="Sparkline"
  >
    <p>
      Used to display a list of timestamps. You should use this only when trying
      to show the relative frequency at which something occurs.
    </p>
    <div class="layout">
      <KCard
        class="table-card"
      >
        <KTableData
          :key="`table-${columnWidth}`"
          :cell-attrs="({ headerKey }) => headerKey === 'sparkline' ? { className: 'spark-cell' } : {}"
          :fetcher="fetcher"
          :fetcher-cache-key="fetcherCacheKey"
          :headers="headers"
          hide-pagination
          :table-preferences="preferences"
        >
          <template #sparkline="{ row }">
            <SparklineChart
              :datasets="row.sparkline"
              :max-count="maxValue"
              :max-stamp="now"
              :min-stamp="minimumDate"
              :point-render-count="pointRenderCount"
              :show-label="showLabel"
              :type="row.type ?? getType(row.sparkline[0].timestamps[0]) as any"
              @max="(val) => onMax(val, row.name)"
            />
          </template>
        </KTableData>
      </KCard>

      <KCard class="control-card">
        <div class="controls">
          <h3>Sparkline settings</h3>
          <KInputSwitch
            v-model="showLabel"
            :label="showLabel ? 'Label visible' : 'Label hidden (default)'"
          />

          <KInputSwitch
            v-model="useColor"
            :label="useColor ? 'Using custom colors' : 'Using default colors'"
          />

          <KSelect
            v-model="type as any"
            :items="[{
              label: 'Random',
              value: 'random',
            }, {
              label: 'Bar',
              value: 'bar',
            }, {
              label: 'Line',
              value: 'line',
            }, {
              label: 'step',
              value: 'step',
            }]"
            label="Type"
          />

          <KSlider
            v-model="pointRenderCount"
            label="Number of datapoints to render per sparkline"
            :max="300"
            :min="2"
          />
        </div>

        <div class="controls">
          <h3>Generator settings</h3>
          <KSlider
            v-model="datasetCount"
            label="Number of datasets to generate"
            :max="5"
            :min="1"
          />
          <KSlider
            v-model="hours"
            label="Hours of data per dataset"
            :max="100"
            :min="1"
          />
          <KSlider
            v-model="pointsPerHour"
            label="Timestamps per hour"
            :max="100"
            :min="1"
          />
          <KSlider
            v-model="skipChance"
            label="Percent chance to skip a generated timestamp"
            :max="100"
            :min="0"
          />
        </div>

        <div class="controls">
          <h3>Table settings</h3>
          <KSlider
            v-model="columnWidth"
            label="Sparkline column width (pixels)"
            :max="1000"
            :min="30"
          />
        </div>
      </KCard>
    </div>
  </SandboxLayout>
</template>

<script setup lang="ts">
import { computed, ref, inject, watch } from 'vue'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'
import { SparklineChart } from '../../src'
import { lookupDatavisColor } from '../../src/utils/colors'

// Inject the app-links from the entry file
const appLinks: SandboxNavigationItem[] = inject('app-links', [])

// calculate the max value of all sparklines so that all sparklines use the same
// scale for their graph
const maxMap = ref<Record<string, number>>({ initial: 1 })
const maxValue = computed<number>(() => {
  const max = Object.keys(maxMap.value).reduce((acc, key) => {
    return Math.max(maxMap.value[key], acc)
  }, 0)
  return max
})
const onMax = (max: number, key: string) => {
  maxMap.value[key] = max
}

// sparkline settings
const pointRenderCount = ref<number>(30)
const showLabel = ref(false)
const useColor = ref(false)
const type = ref('random')
const getType = (randomKey?: number): string => {
  if (type.value === 'random') {
    const index = randomKey ? randomKey % 3 : getRandomInt(0, 2)
    return ['bar', 'line', 'step'][index]
  }

  return type.value
}

// mock data generator
const datasetCount = ref(1)
const hours = ref(5)
const pointsPerHour = ref(20)
const skipChance = ref<number>(50)
const now = ref<number>(Date.now())
const minimumDate = computed(() => Date.now() - (hours.value * 60 * 60 * 1000))
watch(minimumDate, () => {
  now.value = Date.now()
})

function getRandomInt(min: number, max:number) {
  min = Math.ceil(min)
  max = Math.floor(max)
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const generateRandomData = () => {
  const data = []

  let lastDate = minimumDate.value

  for (let i = 0; i < hours.value; i++) {
    // next date is the next hour
    const nextDate = lastDate + (60 * 60 * 1000)

    for (let j = 0; j < pointsPerHour.value; j++) {
      // for each point per hour
      if (Math.random() > (skipChance.value / 100)) {
        data.push(getRandomInt(lastDate, nextDate))
      }
    }

    lastDate = nextDate
  }

  return data // unsorted
}

const generateRandomDatasets = () => {
  const generatedDatasets = []
  for (let i = 0; i < datasetCount.value; i++) {
    const timestamps = generateRandomData()
    const label = timestamps[0]?.toString(36) ?? ''
    const color = lookupDatavisColor(i)

    generatedDatasets.push({
      timestamps,
      label,
      ...(useColor.value && { color }),
    })
  }

  return generatedDatasets
}

const headers = [
  { key: 'sparkline', label: 'Sparkline' },
  { key: 'name', label: 'Name' },
]

const columnWidth = ref<number>(200)
const preferences = computed(() => ({
  columnWidths: {
    'sparkline': columnWidth.value,
  },
}))

const fetcherCacheKey = computed<string>(() => {
  return `key-${skipChance.value}-${pointsPerHour.value}-${hours.value}-${datasetCount.value}-${useColor.value}`
})

const fetcher = () => {
  const sameData = generateRandomDatasets()
  const mockData = [
    { name: 'Same mock data - type bar', sparkline: sameData, type: 'bar' },
    { name: 'Same mock data - type line', sparkline: sameData, type: 'line' },
    { name: 'Same mock data - type step', sparkline: sameData, type: 'step' },
    { name: 'Mock data 4', sparkline: generateRandomDatasets() },
    { name: 'Mock data 5', sparkline: generateRandomDatasets() },
    { name: 'Mock data 6', sparkline: generateRandomDatasets() },
    { name: 'Mock data 7', sparkline: generateRandomDatasets() },
    { name: 'Mock data 8', sparkline: generateRandomDatasets() },
    { name: 'Mock data 9', sparkline: generateRandomDatasets() },
    { name: 'Mock data 10', sparkline: generateRandomDatasets() },
    { name: 'Mock data 11', sparkline: generateRandomDatasets() },
    { name: 'Mock data 12', sparkline: generateRandomDatasets() },
    { name: 'Mock data 13', sparkline: generateRandomDatasets() },
    { name: 'Mock data 14', sparkline: generateRandomDatasets() },
    { name: 'Mock data 15', sparkline: generateRandomDatasets() },
  ]

  return {
    data: mockData,
    total: mockData.length,
  }
}
</script>

<style lang="scss" scoped>
@use "../styles/charts-sandbox";

:deep(.spark-cell) {
  padding-bottom: 0 !important;
  padding-top: 0 !important;
}

.layout {
  display: flex;
  gap: $kui-space-80;
}

.table-card {
  max-width: 50%;
  min-width: 50%;
}

.controls {
  display: flex;
  flex-direction: column;
  gap: $kui-space-80;
  margin-bottom: $kui-space-80;

  &:last-of-type {
    margin-bottom: 0;
  }

  h3 {
    margin: 0;
  }
}
</style>
