export interface QueryError {
  status: number
  type: 'forbidden' | 'timeout' | 'range_exceeded' | 'other'
  message: string
  details?: string
}
