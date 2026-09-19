import type { IConfig, IKey, fetcherFn } from 'swrv'
import useSWRV from 'swrv'
import { computed } from 'vue'

export default function useRequest<Data = unknown, Error = { message: string }>(
  key: IKey,
  fn?: fetcherFn<Data>,
  config?: IConfig,
) {
  const {
    data: response,
    error,
    isValidating,
    mutate: revalidate,
  } = useSWRV<Data, Error>(key, fn, {
    revalidateDebounce: 500,
    revalidateOnFocus: false,
    dedupingInterval: 100,
    ...config,
  })

  const data = computed<Data | undefined>(() => {
    return response.value
  })

  return {
    data,
    response,
    error,
    isValidating,
    revalidate,
  }
}
