import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

export default function useAxios(options: AxiosRequestConfig = {}) {
  const axiosInstance = axios.create({
    withCredentials: true,
    timeout: 30000,
    ...options,
  })

  return {
    axiosInstance,
  }
}
