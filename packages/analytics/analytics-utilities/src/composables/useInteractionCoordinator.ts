import { readonly, ref } from 'vue'

export default function useInteractionCoordinator() {
  const activeTimestamp = ref<number>()
  const activeChart = ref<string>()

  // TODO debounce this
  const setActiveTimestamp = (uuid: string, timestamp: number) => {
    activeChart.value = uuid
    activeTimestamp.value = timestamp
  }

  return {
    test: () => {
      console.log('use interaction coordinator test')
    },
    activeChart: readonly(activeChart),
    activeTimestamp: readonly(activeTimestamp),
    setActiveTimestamp,
  }
}