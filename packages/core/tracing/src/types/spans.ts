import type { TranslationKey } from '../composables/useI18n'
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
  }
}

/**
 * Presenting the definition of a field in the Expressions (ATC) language.
 */
export interface ExpressionsField {
  name: string
  /**
   * When this field is omitted, we will use the `type` of its residing attribute.
   */
  type?: string
}

/**
 * The span attribute that will be used for sampling.
 */
export interface SpanSamplerAttribute {
  name: string
  /**
   * Type under the context of the Expressions (ATC) language.
   */
  type: string
  /**
   * Aliases for the usage in Expressions (ATC).
   */
  aliases?: ExpressionsField[]
}

export interface SpanLatency<Children = never> {
  key: string
  /**
   * When omitted, we will use the `key` as the label.
   */
  labelKey?: TranslationKey
  milliseconds: number
  children?: Children
}

export interface SpanTrees {
  /**
   * Root spans of the span trees.
   */
  roots: SpanNode[]

  /**
   * All spans sorted by start time.
   */
  spans: Span<bigint>[]
}
