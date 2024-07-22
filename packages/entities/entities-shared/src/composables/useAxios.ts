import { useAxios as useAxiosCore } from '@kong-ui-public/core'
import type { AxiosRequestConfig } from 'axios'

export default function useAxios(options: AxiosRequestConfig = {}) {
  const { getAxiosInstance } = useAxiosCore()
  const axiosInstance = getAxiosInstance(options)

  return {
    axiosInstance,
  }
}
