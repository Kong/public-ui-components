import { computed } from 'vue'
import type { Ref, Reactive } from 'vue'
import { useElementBounding } from '@vueuse/core'

export default function useTooltipAbsolutePosition(chartParentRef: Ref<HTMLElement | null>, tooltipData: Reactive<{ left: string, top: string }>) {

  const { top: containerTop, left: containerLeft } = useElementBounding(chartParentRef)

  const tooltipAbsoluteLeft = computed(() => {
    if (!chartParentRef.value) return tooltipData.left
    return `${parseFloat(tooltipData.left) + containerLeft.value}px`
  })
  const tooltipAbsoluteTop = computed(() => {
    if (!chartParentRef.value) return tooltipData.top
    return `${parseFloat(tooltipData.top) + containerTop.value}px`
  })


  return {
    tooltipAbsoluteLeft,
    tooltipAbsoluteTop,
  }
}
