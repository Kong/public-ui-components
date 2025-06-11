import { computed } from 'vue'
import type { Ref, Reactive } from 'vue'

export default function useTooltipAbsolutePosition(chartParentRef: Ref<HTMLElement | null>, tooltipData: Reactive<{ left: string, top: string }>) {
  const tooltipAbsoluteLeft = computed(() => {
    if (!chartParentRef.value) return tooltipData.left
    const rect = chartParentRef.value.getBoundingClientRect()
    return `${parseFloat(tooltipData.left) + rect.left + window.scrollX}px`
  })
  const tooltipAbsoluteTop = computed(() => {
    if (!chartParentRef.value) return tooltipData.top
    const rect = chartParentRef.value.getBoundingClientRect()
    return `${parseFloat(tooltipData.top) + rect.top + window.scrollY}px`
  })

  return {
    tooltipAbsoluteLeft,
    tooltipAbsoluteTop,
  }
}
