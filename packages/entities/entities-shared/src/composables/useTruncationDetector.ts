import { ref, watch, computed, unref } from 'vue'
import type { MaybeRef } from 'vue'

export default function useTruncationDetector(textContent: MaybeRef<HTMLElement>) {
  const textOffsetWidth = ref(0)
  const textScrollWidth = ref(0)
  const truncationCalculated = ref(false)

  const detectTruncation = () => {
    const _textContent = unref(textContent)
    if (_textContent && !truncationCalculated.value) {
      textOffsetWidth.value = (_textContent as HTMLElement).offsetWidth
      textScrollWidth.value = (_textContent as HTMLElement).scrollWidth
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
