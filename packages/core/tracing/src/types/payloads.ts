import type { TraceCaptures } from '@kong/sdk-konnect-js-internal'

export type Direction = 'request' | 'response'
export type Headers = TraceCaptures['request_headers'] | TraceCaptures['response_headers']
export type Body = string

export type Payload = {
  direction: Direction
} & (
  | {
    type: 'headers'
    headers: Headers
  }
  | {
    type: 'body'
    content: Body
  }
)
