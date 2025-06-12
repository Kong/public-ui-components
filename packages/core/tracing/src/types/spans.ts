import type { TranslationKey } from '../composables/useI18n'
import type { Span } from '@kong/sdk-konnect-js-internal'

/**
 * - Span attributes are key-value pairs that provide additional information about the span.
 * - They can include metadata such as HTTP method, status code, user ID, etc.
 * - The values can be of any type, but are typically strings, numbers, or booleans.
 * - The attributes are used for filtering, grouping, and aggregating spans in the tracing system.
 */
export type SpanAttributes = Record<string, unknown>

export interface SpanNode {
  span: Span
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
    startTimeUnixNano?: string
    /**
     * The latest end time among all nodes in the subtree
     */
    endTimeUnixNano?: string
  }
}

/**
 * Types for values in the Expressions (ATC) language.
 */
export type ATCValueType = 'String' | 'IpCidr' | 'IpAddr' | 'Int' | 'Regex'

/**
 * Presenting the definition of a field in the Expressions (ATC) language.
 */
export interface ExpressionsField {
  name: string
  /**
   * When this field is omitted, we will use the `type` of its residing attribute.
   */
  type?: ATCValueType
}

/**
 * The span attribute that will be used for sampling.
 */
export interface SpanSamplerAttribute {
  name: string
  /**
   * Type under the context of the Expressions (ATC) language.
   */
  type: ATCValueType
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
  spans: Span[]
}
