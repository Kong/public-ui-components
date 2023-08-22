import { computed, unref } from 'vue'
import type {
  KongManagerBaseTableConfig,
  KonnectBaseTableConfig,
  MaybeRef,
} from '../types'

export default function useDeleteUrlBuilder(
  config: KonnectBaseTableConfig | KongManagerBaseTableConfig,
  baseUrl: MaybeRef<string>,
) {
  const _baseUrl = unref(baseUrl)

  // Construct a URL object, adding the current `window.location.origin` if the path begins with a slash
  const baseRequestUrl = computed((): URL =>
    config.apiBaseUrl.startsWith('/')
      ? new URL(`${window.location.origin}${_baseUrl}`)
      : new URL(_baseUrl),
  )

  baseRequestUrl.value.search = '' // trim any query params

  return (id: string): string => `${baseRequestUrl.value.href}/${id}`
}
