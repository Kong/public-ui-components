import type { MultiselectComposableOptions } from '../types'
import { ref } from 'vue'
import type { MultiselectItem } from '@kong/kongponents'

export default function useMultiselectCreation(options: MultiselectComposableOptions) {
  const { replaceId = false } = options

  const addedItems = ref<MultiselectItem[]>([])

  const trackNewItems = (item: MultiselectItem, added: boolean) => {
    if (added) {
      const _item: MultiselectItem = { ...item }
      if (replaceId) {
        _item.value = item.label
      }

      addedItems.value.push(_item)
    } else {
      addedItems.value = addedItems.value.filter(anItem => anItem.value !== item.value)
    }
  }

  return {
    addedItems,
    trackNewItems,
  }
}
