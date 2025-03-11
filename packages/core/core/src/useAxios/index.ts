import axios from 'axios'
import { inject } from 'vue'
import type { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'

export default function useAxios() {
  console.log('Change #2')
  /**
   * A function to return the app-level provided base axios instance, if it exists. Otherwise, returns a fallback axios instance.
   * @param {AxiosRequestConfig} options The axios request config
   * @returns {AxiosInstance} The axios instance
   */
  const getAxiosInstance = (options: AxiosRequestConfig = {}) => {
    try {
      const injectedInstance = inject<((options?: AxiosRequestConfig) => AxiosInstance) | undefined>('get-axios-instance', undefined)
      // If the injected instance exists, return the called function
      if (typeof injectedInstance === 'function') {
        return injectedInstance(options)
      }

      // Otherwise, return a fallback instance
      return axios.create({
        withCredentials: true,
        timeout: 30000,
        ...options,
      })
    } catch (err: any) {
      // Log a warning
      console.warn('getAxiosInstance:', err.message || err)

      // Return a fallback instance
      return axios.create({
        withCredentials: true,
        timeout: 30000,
        ...options,
      })
    }
  }

  /**
   * Get the `x-datadog-trace-id` header from the provided error, if it exists
   * @param {AxiosError | any} error The response error
   * @returns {string} The trace ID
   */
  const getTraceIdFromError = (error: AxiosError | any): string => {
    return error?.response?.headers['x-datadog-trace-id'] || ''
  }

  return {
    getAxiosInstance,
    getTraceIdFromError,
  }
}
