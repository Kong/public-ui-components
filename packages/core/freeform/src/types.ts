import type { UnionFieldSchema } from './form-schema'
import type { Component, ComponentPublicInstance, Slot } from 'vue'
import { type LabelAttributes } from '@kong/kongponents'

type ComponentPublicInstanceConstructor = {
  new (...args: any[]): ComponentPublicInstance<any>
}

export type PropType<T extends ComponentPublicInstanceConstructor> =
  InstanceType<T>['$props'] & { [key: string]: unknown }


export type FormConfig<T extends Record<string, any> = Record<string, any>> = {
  prepareFormData?: (data: any) => any
  transformLabel?: (label: string, fieldPath: string) => string
  hasValue?: (data: T | undefined) => boolean
  /**
   * Sync value after `change` event for every text-like input.
   */
  updateOnChange?: boolean
  /**
   * Controls the sentinel value written when a field has no value: initial
   * defaults for non-required fields, hidden-field resets, and fields the
   * user actively clears. Defaults to `'null'`, matching the framework's
   * existing behavior.
   */
  emptyFieldValue?: 'null' | 'undefined'
}

/**
 * The sentinel written for an "empty" field, per `FormConfig.emptyFieldValue`.
 */
export type EmptyValue = null | undefined

/**
 * Resolves `FormConfig.emptyFieldValue` to the actual sentinel value.
 */
export function resolveEmptyFieldValue(emptyFieldValue?: 'null' | 'undefined'): EmptyValue {
  return emptyFieldValue === 'undefined' ? undefined : null
}

/**
 * Defines how the form field's label path should be constructed.
 */
export type ResetLabelPathRule =
  | 'inherit' // Default, both current and descendants inherit the path.
  | 'reset' // Both current and descendants discard the parent path and start from current path.
  | 'reset-children' // Inherit paths on its own, but descendant paths start from current path.
  | 'isolate' // Isolate paths for both current and descendants.
  | 'isolate-children' // Inherit paths on its own, children do not inherit.

/**
 * Global action that any field can trigger
 * @deprecated use `useToaster` instead
 */
export type GlobalAction = 'notify'

/**
 * Rules to control the rendering of form fields.
 * Only `Form` and `ObjectField` components can accept these rules
 */

export interface RenderRules {
  /**
   * Bundles of fields to be rendered together.
   * - Each bundle is an array of field paths.
   * - Each bundle should be in the same level.
   * - Circular references between bundles are not allowed.
   * @example
   * ```ts
   * [
   *   ['config.username', 'config.password'], // first bundle
   *   ['config.strategy', 'config.redis'], // second bundle
   *   ['config.strategy', 'config.cache.redis'], // ❌ different levels are not allowed
   *   ['config.redis', 'config.strategy'], // ❌ circular reference not allowed
   * ]
   */
  bundles?: string[][]

  /**
   * Dependencies between fields to control their visibility.
   * - A field will be shown only if its dependency is satisfied.
   * - A field will only have a value if its dependency is satisfied.
   * - Field and its dependency should be in the same level.
   * - Circular dependencies are not allowed.
   *
   * The `fieldValue` can be:
   * - A primitive or plain object — deeply compared with `isEqual`.
   * - An array — treated as **any-of**: shown when the dependency value matches any element. Suitable for string fields.
   * - `renderRuleExactMatch(value)` — for rare cases where the dependency field itself holds an array value
   *   and exact deep equality is required. Using a Symbol-keyed wrapper avoids collision with plain objects.
   *
   * @example
   * ```ts
   * import { renderRuleExactMatch } from '../types'
   *
   * {
   *   'config.redis': ['config.strategy', 'redis'],
   *   'config.mode': ['config.strategy', ['redis', 'cluster']], // any-of: shown when strategy is 'redis' or 'cluster'
   *   'config.tags': ['config.required_tags', renderRuleExactMatch(['a', 'b'])], // exact array match
   *   'config.cache.redis': ['config.strategy', 'cache'], // ❌ different levels are not allowed
   *   'config.strategy': ['config.redis', {}], // ❌ circular dependency not allowed
   * }
   * ```
   */
  dependencies?: {
    [fieldPath: string]: [fieldPath: string, fieldValue: unknown]
  }
}

export interface BaseFieldProps {
  autofocus?: boolean
  name: string
  labelAttributes?: LabelAttributes
}

export type Match = (opt: {
  path: string
  /**
   * A generic path pattern that can be used for matching multiple fields,
   * e.g. `config.callouts.*.redis` can match `config.callouts.1.redis` and `config.callouts.2.redis`.
   */
  genericPath: string
  schema: UnionFieldSchema
}) => boolean

export type MatchMap = Map<Match, Slot<{ name: string }>>

export type PropsOverridesFn = (props: Record<string, unknown>) => Record<string, unknown>

export interface FieldRendererRule {
  match: string | Match
  component: Component
  propsOverrides?: Record<string, unknown> | PropsOverridesFn
}

export type KeyId = `kid:${number}`
