import type { Ref } from 'vue'
import { ref, watch } from 'vue'
import type { KChartData } from '../types'

export default function useChartLabelSelection(chartData: Ref<KChartData>) {
  const selectedLabels = ref<Record<string, boolean>>({})

  watch(() => chartData.value.datasets.map(dataset => dataset.label || ''), (labels) => {
    const nextSelection = { ...selectedLabels.value }
    const labelSet = new Set(labels)

    Object.keys(nextSelection).forEach((label) => {
      if (!labelSet.has(label)) {
        delete nextSelection[label]
      }
    })

    labels.forEach((label) => {
      if (!(label in nextSelection)) {
        nextSelection[label] = true
      }
    })

    selectedLabels.value = nextSelection
  }, { immediate: true })

  const toggleLegendItem = (label: string) => {
    selectedLabels.value = {
      ...selectedLabels.value,
      [label]: selectedLabels.value[label] === false,
    }
  }

  return { selectedLabels, toggleLegendItem }
}
