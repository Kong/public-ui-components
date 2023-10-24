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

  watch(textContent, (content: HTMLElement) => {
    if (content && !truncationCalculated.value) {
      textOffsetWidth.value = (content as HTMLElement).offsetWidth
      textScrollWidth.value = (content as HTMLElement).scrollWidth
      truncationCalculated.value = true
    }
  })

  const isTruncated = computed<boolean>(() => {
    return textOffsetWidth.value < textScrollWidth.value
  })

  return {
    isTruncated,
  }
}
