import type { IKeyValue } from './otlp'

export interface Span {
  traceId: string
  spanId: string
  /**
   * The parent span ID of this span.
   * If this is a root span, this field is not set or only contains zeros.
   */
  parentSpanId?: string
  name: string
  startTimeUnixNano: string
  endTimeUnixNano: string
  attributes?: IKeyValue[]
  events?: Event[]
}

export interface Event {
  name: string
  timeUnixNano: string
  attributes?: IKeyValue[]
}

export interface SpanNode {
  span: Span
  root?: boolean
  durationNano: number // Number.MAX_SAFE_INTEGER / 1e9 / 60 / 60 / 24 = 104.24999137431702 days (enough for most cases)
  parent?: SpanNode
  children: SpanNode[]
}

interface AttributeSchema {
  name: string
  type: string
}

export interface SpanAttributeSchema extends AttributeSchema {
  alias?: string
  useForSampling?: boolean
}

export type SpanEventAttributeSchema = AttributeSchema
