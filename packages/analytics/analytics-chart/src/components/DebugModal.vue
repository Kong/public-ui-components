<template>
  <KTooltip v-if="secretCodeEntered">
    <SupportIcon
      class="debug-icon"
      :size="KUI_ICON_SIZE_40"
      @click="showDebugModal = true"
    />
    <template #content>
      {{ i18n.t('debug') }}
    </template>
  </KTooltip>

  <KPrompt
    :is-visible="showDebugModal"
    @canceled="showDebugModal = false"
    @proceed="showDebugModal = false"
  >
    <template #body-content>
      <KTabs :tabs="tabs">
        <template #analytics-chart-data>
          <KCodeBlock
            v-if="analyticsChartData"
            id="analyics-data-codeblock"
            :code="analyticsChartData"
            is-searchable
            language="json"
            max-height="250px"
          />
        </template>
        <template #chart-js-data>
          <KCodeBlock
            v-if="chartData"
            id="chartjs-data-codeblock"
            :code="chartData"
            is-searchable
            language="json"
            max-height="250px"
          />
        </template>
        <template #chart-options>
          <KCodeBlock
            v-if="chartOptions"
            id="options-codeblock"
            :code="chartOptions"
            is-searchable
            language="json"
            max-height="250px"
          />
        </template>
      </KTabs>
    </template>
  </KPrompt>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { SupportIcon } from '@kong/icons'
import composables from '../composables'
import { KUI_ICON_SIZE_40 } from '@kong/design-tokens'

defineProps({
  analyticsChartData: {
    type: String,
    required: true,
  },
  chartData: {
    type: String,
    required: true,
  },
  chartOptions: {
    type: String,
    required: true,
  },
})

const { i18n } = composables.useI18n()
const showDebugModal = ref(false)

const tabs = [
  {
    hash: '#analytics-chart-data',
    title: 'Chart Data',
  },
  {
    hash: '#chart-js-data',
    title: 'ChartJS Data',
  },
  {
    hash: '#chart-options',
    title: 'Chart Options',
  },
]

const secretCode = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'KeyB', 'KeyA']
const secretCodeEntered = ref(false)
const inputSequence = ref<String[]>([])

const checkKonamiCode = (event: KeyboardEvent) => {
  inputSequence.value.push(event.code)
  if (inputSequence.value.length > secretCode.length) {
    inputSequence.value.shift()
  }

  if (secretCode.every((v: string, i: number) => v === inputSequence.value[i])) {
    secretCodeEntered.value = true
  }

  window.setTimeout(() => {
    inputSequence.value.fill('')
  }, 20000)
}

onMounted(() => {
  window.addEventListener('keydown', checkKonamiCode)
})

onUnmounted(() => {
  window.removeEventListener('keydown', checkKonamiCode)
})
</script>

<style lang="scss" scoped>
.debug-tooltip {
  position: relative;
  cursor: pointer;
  right: 30px;
  top: 50px;
  z-index: 10;

  .debug-icon {
    transition: opacity 0.25s ease-out;
    &:hover {
      opacity: 0.6;
    }
  }
}
</style>
