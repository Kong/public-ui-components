import type { Ref } from 'vue'

export type MaybeRef<T> = T | Ref<T>

export interface FilterKeys {
  fetchedItemsKey: string
  searchKeys: string[]

  /**
   * The key to look for while doing exact match
   *
   * @default 'id'
   */
  exactMatchKey?: string
}
