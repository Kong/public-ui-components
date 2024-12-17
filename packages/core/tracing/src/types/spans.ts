import type { IKeyValue } from './otlp'

/**
 * The type parameter `Time` is used to specify the type of the timestamps in the span.
 * The `buildSpanTrees` utility will convert string timestamps to bigint ones.
 *
 * We will internally use `Span<bigint>` in `SpanNode` for performance reasons, while we will expose
 * `Span<string>` by default to avoid breaking changes in the public API.
 */
export interface Span<Time extends string | bigint = string> {
  traceId: string
  spanId: string
  /**
   * The parent span ID of this span.
   * If this is a root span, this field is not set or only contains zeros.
   */
  parentSpanId?: string
  name: string
  startTimeUnixNano?: Time
  endTimeUnixNano?: Time
  attributes?: IKeyValue[]
  events?: Event[]
}

export interface Event {
  name: string
  timeUnixNano: string
  attributes?: IKeyValue[]
}

export interface SpanNode {
  span: Span<bigint>
  root?: boolean
  durationNano?: number // Number.MAX_SAFE_INTEGER / 1e9 / 60 / 60 / 24 = 104.24999137431702 days (enough for most cases)
  parent?: SpanNode
  children: SpanNode[]
  /**
   * Aggregated values from all nodes (including the current one) in the subtree.
   * This stores values bottom-up and allows us to avoid extra tree traversal while building the trace trees.
   */
  subtreeValues: {
    /**
     * The earliest start time among all nodes in the subtree.
     */
    startTimeUnixNano?: bigint
    /**
     * The latest end time among all nodes in the subtree
     */
    endTimeUnixNano?: bigint
    /**
     * The minimum duration among all nodes in the subtree.
     * Default to the duration of the span itself.
     */
    minDurationNano?: number
  }
}

interface AttributeSchema {
  name: string
  type: string
}

export interface SpanAttributeExprAlias {
  name: string
  type: string
}

/**
 * Definition of the sampling rule configuration for a span attribute.
 * This is mainly used under the context of the Expressions (ATC) language.
 */
export interface SpanAttributeSampling {
  /**
   * Type of the value in Expressions (ATC). This field is currently preserved.
   * When omitted, the type is inferred from the span attribute.
   */
  type?: string
  /**
   * Aliases for the usage in Expressions (ATC). This field is currently preserved.
   * If a string is used as an alias, the type is inferred from the sampling rules configuration.
   */
  aliases?: (SpanAttributeExprAlias | string)[]
}

export interface SpanAttributeSchema extends AttributeSchema {
  /**
   * Configuration for sampling rules associated with this attribute.
   * When omitted, the attribute is not used for sampling.
   */
  sampling?: boolean | SpanAttributeSampling
  internal?: boolean
}

export type SpanEventAttributeSchema = AttributeSchema
