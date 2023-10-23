import { ref, watch, computed } from 'vue'
import type { Ref } from 'vue'

export default function useTruncationDetector(textContent: Ref<HTMLElement>) {
  const textOffsetWidth = ref(0)
  const textScrollWidth = ref(0)
  const truncationCalculated = ref(false)

  const detectTruncation = () => {
    if (textContent.value && !truncationCalculated.value) {
      textOffsetWidth.value = (textContent.value as HTMLElement).offsetWidth
      textScrollWidth.value = (textContent.value as HTMLElement).scrollWidth
      truncationCalculated.value = true
    }
  }

  watch(textContent, detectTruncation)

  const isTruncated = computed(() => {
    return textOffsetWidth.value < textScrollWidth.value
  })

  return {
    isTruncated,
  }
}
