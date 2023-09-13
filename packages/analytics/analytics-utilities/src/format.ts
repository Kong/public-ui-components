import { format } from 'date-fns'

export function formatISOTimeWithTZ(ts: number | Date) {
  return format(ts, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX")
}
