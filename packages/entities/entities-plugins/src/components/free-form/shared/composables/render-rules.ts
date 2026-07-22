import { computed, onBeforeUnmount, ref, toValue, watch } from 'vue'
import { generalizePath } from './schema'
import { get, isEqual } from 'lodash-es'
import * as utils from '../utils'

import type { MaybeRefOrGetter } from 'vue'
import type { RenderRules } from '../types'
import type { UnionFieldSchema } from '../../../../types/plugins/form-schema'

/**
 * Symbol used internally to tag values created by `renderRuleExactMatch`.
 * Using a Symbol prevents accidental collision with plain domain objects
 * that happen to share the same key names.
 */
export const RENDER_RULE_EXACT_MATCH = Symbol('ff-render-rule-exact-match')

/**
 * Wraps a value so that dependency checks use **exact deep equality** instead
 * of the default any-of semantics that apply when an array is passed.
 *
 * Use this when the dependency field itself holds an array value and you need
 * to match it precisely.
 *
 * @example
 * ```ts
 * import { renderRuleExactMatch } from './composables/render-rules'
 *
 * // Show 'field_b' only when 'field_a' equals exactly ['x', 'y']
 * dependencies: { field_b: ['field_a', renderRuleExactMatch(['x', 'y'])] }
 * ```
 */
export function renderRuleExactMatch<T>(value: T): { [RENDER_RULE_EXACT_MATCH]: T } {
  return { [RENDER_RULE_EXACT_MATCH]: value }
}

/**
 * Evaluates whether a dependency condition is satisfied.
 * - `renderRuleExactMatch(value)` → exact deep equality (dependency field holds an array).
 * - array → any-of: satisfied when the actual value matches any element.
 * - anything else → exact deep equality.
 */
export function meetsDependency(actual: unknown, expected: unknown): boolean {
  const isExactWrapper = typeof expected === 'object'
    && expected !== null
    && RENDER_RULE_EXACT_MATCH in (expected as object)

  if (isExactWrapper) {
    return isEqual(actual, (expected as Record<typeof RENDER_RULE_EXACT_MATCH, unknown>)[RENDER_RULE_EXACT_MATCH])
  }
  if (Array.isArray(expected)) {
    return expected.some((v: unknown) => isEqual(actual, v))
  }
  return isEqual(actual, expected)
}

export function createRenderRuleRegistry(
  getSchemaMap: () => Record<string, UnionFieldSchema>,
  getFormData: () => Record<string, any>,
) {
  type RenderRulesMap = Record<string, RenderRules>
  const registry = ref<RenderRulesMap>({})
  // Fields the host form manages itself (ObjectField `omit`), keyed by the
  // registering field's concrete path. Such fields are never hidden by rules.
  const omittedRegistry = ref<Record<string, string[]>>({})

  /**
   * Validates that all fields in a bundle/dependency are at the same level
   */
  function validateSameLevel(fields: string[], context: string): void {
    const levels = fields.map(f => utils.toArray(f).length)
    const firstLevel = levels[0]

    if (!levels.every(level => level === firstLevel)) {
      const fieldInfo = fields.map((f, i) => `  - '${f}' is at level ${levels[i]}`).join('\n')
      throw new Error(
        `${context}: Fields must be at the same level. Found mixed levels:\n${fieldInfo}`,
      )
    }
  }

  /**
   * Validates that there are no circular references in the bundles
   *
   * @example
   * Invalid (cycle detected):
   * bundles: [
   *   ['field1', 'field2'],
   *   ['field2', 'field3'],
   *   ['field3', 'field1'], // ❌ cycle here
   *   ['field4', 'field5', 'field4'] // ❌ self-dependency
   * ]
   */
  function validateNoCycleInBundles(rules: RenderRulesMap): void {
    for (const [path, rule] of Object.entries(rules)) {
      if (!rule.bundles) continue

      // Check for self-cycles within a single bundle
      for (const bundle of rule.bundles) {
        const uniqueFields = new Set(bundle)
        if (uniqueFields.size !== bundle.length) {
          const duplicates = bundle.filter((field, index) => bundle.indexOf(field) !== index)
          throw new Error(
            `Self-cycle detected in bundle: field '${duplicates[0]}' appears multiple times in [${bundle.join(', ')}]`,
          )
        }
      }

      // Check for cycles between bundles
      // Build a dependency graph: for bundle [a, b, c], create edges b->a, c->b
      // This represents that b depends on a, c depends on b
      const bundleGraph = new Map<string, Set<string>>()
      for (const bundle of rule.bundles) {
        for (let i = 1; i < bundle.length; i++) {
          const dependent = bundle[i]
          const dependency = bundle[i - 1]

          if (!bundleGraph.has(dependent)) {
            bundleGraph.set(dependent, new Set())
          }
          bundleGraph.get(dependent)!.add(dependency)
        }
      }

      // Use DFS to detect cycles
      for (const field of bundleGraph.keys()) {
        const visited = new Set<string>()
        const stack: string[] = []

        function dfs(currentField: string): void {
          if (stack.includes(currentField)) {
            const cycle = [...stack, currentField].join(' -> ')
            throw new Error(
              `Circular bundle detected in path '${path}':\n${cycle}`,
            )
          }

          if (visited.has(currentField)) return

          visited.add(currentField)
          stack.push(currentField)

          const dependencies = bundleGraph.get(currentField)
          if (dependencies) {
            for (const dependency of dependencies) {
              dfs(dependency)
            }
          }

          stack.pop()
        }

        dfs(field)
      }
    }
  }

  /**
   * Validates that there are no circular dependencies in the rules
   * @example
   * dependencies: {
   *   'field1': ['field2', 'typeA'],
   *   'field2': ['field3', 'typeB'],
   *   'field3': ['field1', 'typeC'], // ❌ cycle here
   *   'field4': ['field4', 'typeD']  // ❌ self-dependency
   * }
   */
  function validateNoCycleInDeps(rules: RenderRulesMap): void {
    for (const [path, rule] of Object.entries(rules)) {
      if (!rule.dependencies) continue

      // Check each field for circular dependencies
      for (const field of Object.keys(rule.dependencies)) {
        const visited = new Set<string>()
        const stack: string[] = []

        function dfs(currentField: string): void {
          if (stack.includes(currentField)) {
            const cycle = [...stack, currentField].join(' -> ')
            throw new Error(
              `Circular dependency detected in path '${path}':\n${cycle}`,
            )
          }

          if (visited.has(currentField)) return

          visited.add(currentField)
          stack.push(currentField)

          const dep = rule.dependencies![currentField]
          if (dep) {
            const [depField] = dep
            if (rule.dependencies![depField]) {
              dfs(depField)
            }
          }

          stack.pop()
        }

        dfs(field)
      }
    }
  }

  /**
   * Finds the common parent path for a group of fields
   * @example
   * Input: ['a.b.c', 'a.b.d', 'a.b.e'], basePath: 'config'
   * Output: 'config.a.b'
   */
  function findCommonParentPath(fields: string[], basePath: string): string {
    const fullPaths = fields.map(f => basePath ? utils.resolve(basePath, f) : f)

    // Get the parent path of the first field
    const firstFieldParts = utils.toArray(fullPaths[0])
    firstFieldParts.pop() // Remove the field name

    return utils.resolve(...firstFieldParts)
  }

  /**
   * Removes the parent path prefix from a field path
   * @example
   * Input: fieldPath: 'config.a.b.c', parentPath: 'config.a.b'
   * Output: 'c'
   */
  function removePrefix(fieldPath: string, parentPath: string): string {
    if (!parentPath) return fieldPath

    const prefix = `${parentPath}${utils.separator}`
    if (fieldPath.startsWith(prefix)) {
      return fieldPath.slice(prefix.length)
    }

    return fieldPath
  }

  /**
   * Gets the parent path of a field path
   */
  function getParentPath(fieldPath: string): string {
    const parts = utils.toArray(fieldPath)
    parts.pop()
    return utils.resolve(...parts)
  }

  /**
   * Flattens the render rules from the registry into a path-specific structure.
   *
   * This computed property transforms the registered rules by:
   * 1. Extracting the parent path from each bundle/dependency field
   * 2. Grouping fields by their common parent path
   * 3. Removing the parent path prefix from field names
   * 4. Validating rules (same level, minimum fields, no cycles)
   *
   * @example
   * Input (registry):
   * {
   *   '$': {
   *     bundles: [['config.username', 'config.password']],
   *     dependencies: { 'config.redis': ['config.strategy', 'redis'] }
   *   }
   * }
   *
   * Output (flattenedRules):
   * {
   *   'config': {
   *     bundles: [['username', 'password']],
   *     dependencies: { 'redis': ['strategy', 'redis'] }
   *   }
   * }
   *
   * @throws {Error} If bundle contains less than 2 fields
   * @throws {Error} If bundles have cycles
   * @throws {Error} If fields in bundle/dependency are at different levels
   * @throws {Error} If dependencies have cycles
   */
  function buildFlattenedRules(): RenderRulesMap {
    const result: RenderRulesMap = {}

    // Iterate through each rule in the registry
    for (const [registryPath, rules] of Object.entries(registry.value)) {
      const basePath = registryPath === utils.rootSymbol ? '' : registryPath

      // Process bundles
      if (rules.bundles) {
        for (const bundle of rules.bundles) {
          // Validate: bundle must contain at least 2 fields
          if (bundle.length < 2) {
            throw new Error(
              `Bundle must contain at least 2 fields. Found ${bundle.length} field(s) in bundle: [${bundle.join(', ')}]`,
            )
          }

          // Build full paths for validation
          const fullPaths = bundle.map(f => basePath ? utils.resolve(basePath, f) : f)

          // Validate: all fields in bundle must be at the same level
          validateSameLevel(fullPaths, `Bundle [${bundle.join(', ')}]`)

          // Find the common parent path for this bundle
          const parentPath = findCommonParentPath(bundle, basePath) || utils.rootSymbol

          if (!result[parentPath]) {
            result[parentPath] = {}
          }
          if (!result[parentPath].bundles) {
            result[parentPath].bundles = []
          }

          // Remove parent path prefix from each field
          const relativeBundle = fullPaths.map(field => removePrefix(field, parentPath))
          result[parentPath].bundles!.push(relativeBundle)
        }
      }

      // Process dependencies
      if (rules.dependencies) {
        for (const [fieldPath, [depPath, depValue]] of Object.entries(rules.dependencies)) {
          // Build full paths
          const fullFieldPath = basePath ? utils.resolve(basePath, fieldPath) : fieldPath
          const fullDepPath = basePath ? utils.resolve(basePath, depPath) : depPath

          // Validate: field and its dependency must be at the same level
          validateSameLevel(
            [fullFieldPath, fullDepPath],
            `Dependency '${fieldPath}' -> '${depPath}'`,
          )

          const parentPath = getParentPath(fullFieldPath) || utils.rootSymbol

          if (!result[parentPath]) {
            result[parentPath] = {}
          }
          if (!result[parentPath].dependencies) {
            result[parentPath].dependencies = {}
          }

          // Remove parent path prefix from both field and dependency
          const relativeFieldPath = removePrefix(fullFieldPath, parentPath)
          const relativeDepPath = removePrefix(fullDepPath, parentPath)
          result[parentPath].dependencies![relativeFieldPath] = [relativeDepPath, depValue]
        }
      }
    }

    // Validate: no circular bundles
    validateNoCycleInBundles(result)

    // Validate: no circular dependencies
    validateNoCycleInDeps(result)

    return result
  }

  /**
   * Flattened rules for the whole form. Rule validation (bundle size, same
   * level, cycles) throws inside `buildFlattenedRules`; we catch it here so
   * that invalid rules degrade to "no rules" (fields render normally) with a
   * console error, instead of crashing every consumer that reads this value.
   */
  const flattenedRules = computed<RenderRulesMap>(() => {
    try {
      return buildFlattenedRules()
    } catch (error) {
      console.error('Invalid render rules:', error instanceof Error ? error.message : String(error))
      return {}
    }
  })

  function getRules(fieldPath?: string): RenderRules | undefined {
    if (!fieldPath) {
      return flattenedRules.value
    }

    // Use flattenedRules to get path-specific rules
    const generalizedPath = generalizePath(fieldPath, getSchemaMap())
    return flattenedRules.value[generalizedPath]
  }

  function createComputedRules(fieldPath: MaybeRefOrGetter<string | undefined>) {
    let hasError = false
    return computed(() => {
      if (hasError) return undefined
      const pathValue = toValue(fieldPath)
      try {
        return getRules(pathValue)
      } catch (error) {
        hasError = true
        // If an error occurs (e.g., invalid path), return undefined
        console.error(`Failed to get render rules for path: \`${pathValue}\`,`, error instanceof Error ? error.message : '')
        return undefined
      }
    })
  }

  /**
   * Whether any dependency rule exists at all — lets consumers skip visibility
   * work entirely for the common case of forms without conditional fields.
   */
  const hasDependencies = computed(() =>
    Object.values(flattenedRules.value).some(
      rule => rule.dependencies && Object.keys(rule.dependencies).length > 0,
    ),
  )

  function useCurrentRules(options: {
    fieldPath: MaybeRefOrGetter<string>
    rules?: MaybeRefOrGetter<RenderRules | undefined>
    omittedFields?: MaybeRefOrGetter<string[] | undefined>
  }) {
    const {
      fieldPath,
      rules,
      omittedFields,
    } = options

    // Register/unregister this field's rules and omitted children by path.
    // Visibility itself is derived lazily by `isFieldHidden`, so there is no
    // imperative hidden-state to keep in sync here.
    watch([
      () => toValue(rules),
      () => toValue(fieldPath),
      () => toValue(omittedFields),
    ], ([newRules, path, omitted], [, oldPath]) => {
      if (newRules) {
        registry.value[path] = newRules
      } else {
        delete registry.value[path]
      }

      if (omitted && omitted.length) {
        omittedRegistry.value[path] = [...omitted]
      } else {
        delete omittedRegistry.value[path]
      }

      // Clean up old path
      if (oldPath && oldPath !== path) {
        delete registry.value[oldPath]
        delete omittedRegistry.value[oldPath]
      }
    }, { immediate: true, deep: true })

    const computedRules = createComputedRules(fieldPath)

    // Clean up on unmount
    onBeforeUnmount(() => {
      const path = toValue(fieldPath)
      delete registry.value[path]
      delete omittedRegistry.value[path]
    })

    return computedRules
  }

  /**
   * Pure visibility check: a field is hidden when a dependency rule targets it
   * and the dependency's current value does not satisfy the condition.
   *
   * Derived on demand from the flattened rules and the live form data, so any
   * reactive consumer (e.g. a field's `hide` computed, or `getValue`) tracks the
   * exact dependency value it reads and re-evaluates when that value changes.
   */
  function isFieldHidden(fieldPath: string): boolean {
    const parts = utils.toArray(fieldPath)
    if (!parts.length) return false

    const fieldName = parts[parts.length - 1]
    const parentPath = utils.resolve(...parts.slice(0, -1)) // '' for root-level fields

    // Fields the host form manages itself are never hidden by render rules.
    if (omittedRegistry.value[parentPath]?.includes(fieldName)) return false

    const rulesKey = parentPath === ''
      ? utils.rootSymbol
      : generalizePath(parentPath, getSchemaMap())
    const dependency = flattenedRules.value[rulesKey]?.dependencies?.[fieldName]
    if (!dependency) return false

    const [depName, expectedValue] = dependency
    const depPath = parentPath ? utils.resolve(parentPath, depName) : depName
    const actualValue = get(getFormData(), utils.toArray(depPath))

    return !meetsDependency(actualValue, expectedValue)
  }

  return {
    useCurrentRules,
    createComputedRules,
    hasDependencies,
    isFieldHidden,
  }
}
