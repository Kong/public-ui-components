import axios from 'axios'
import { inject } from 'vue'
import type { AxiosInstance, AxiosError, AxiosRequestConfig } from 'axios'

export default function useAxios() {
  /**
   * A function to return the app-level provided base axios instance, if it exists. Otherwise, returns a fallback axios instance.
   * @param {AxiosRequestConfig} options The axios request config
   * @returns {AxiosInstance} The axios instance
   */
  const getAxiosInstance = (options?: AxiosRequestConfig) => {
    const fallbackInstance: AxiosInstance = axios.create({
      withCredentials: true,
      timeout: 30000,
      ...options,
    })

    try {
      return inject<(options?: AxiosRequestConfig) => AxiosInstance>('get-axios-instance', (): AxiosInstance => {
        // Return a fallback instance if the injection key is not provided
        return fallbackInstance
      })
    } catch (err: any) {
      console.warn('getAxiosInstance:', err.message || err)
      // inject() can only be used inside setup() or functional components, so provide the fallback instance
      return fallbackInstance
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
