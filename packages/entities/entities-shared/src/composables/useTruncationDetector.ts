import { ref, watch, computed } from 'vue'
import type { Ref } from 'vue'

/**
 * Returns a computed boolean indicating whether the textContent is truncated.
 *
 * @param textContent {Ref<HTMLElement>} ref to the element to detect truncation on.
 *
 * @returns {isTruncated: Ref<boolean>} ref to a boolean indicating whether the textContent is truncated.
 */
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

  const isTruncated = computed<boolean>(() => {
    return textOffsetWidth.value < textScrollWidth.value
  })

  return {
    isTruncated,
  }
}
