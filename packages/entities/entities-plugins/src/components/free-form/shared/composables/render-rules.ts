import { computed, onBeforeUnmount, readonly, ref, toValue, watch } from 'vue'
import { generalizePath } from './schema'
import { get, isEqual } from 'lodash-es'
import * as utils from '../utils'

import type { MaybeRefOrGetter } from 'vue'
import type { RenderRules } from '../types'

export function createRenderRuleRegistry(onChange: () => void) {
  type RenderRulesMap = Record<string, RenderRules>
  const registry = ref<RenderRulesMap>({})
  const hiddenPaths = ref<Set<string>>(new Set())

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
  const flattenedRules = computed<RenderRulesMap>(() => {
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
  })

  function getRules(fieldPath?: string): RenderRules | undefined {
    if (!fieldPath) {
      return flattenedRules.value
    }

    // Use flattenedRules to get path-specific rules
    const generalizedPath = generalizePath(fieldPath)
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

  function useCurrentRules(options: {
    fieldPath: MaybeRefOrGetter<string>
    rules?: MaybeRefOrGetter<RenderRules | undefined>
    parentValue?: MaybeRefOrGetter<unknown>
    omittedFields?: MaybeRefOrGetter<string[] | undefined>
  }) {
    const {
      fieldPath,
      rules,
      parentValue,
      omittedFields,
    } = options
    // Watch for changes in rules or fieldPath
    watch([
      () => toValue(rules),
      () => toValue(fieldPath),
    ], ([newRules, path], [, oldPath]) => {
      // Set new rules
      if (newRules) {
        registry.value[path] = newRules
      } else {
        delete registry.value[path]
      }

      // Clean up old path
      if (oldPath && oldPath !== path) {
        delete registry.value[oldPath]
      }
    }, { immediate: true, deep: true })

    const computedRules = createComputedRules(fieldPath)

    watch(
      [
        () => toValue(parentValue),
        () => toValue(computedRules)?.dependencies,
        () => toValue(fieldPath),
        () => toValue(omittedFields),
      ],
      ([parent, deps, path, omitted]) => {
        if (!deps || !parent) return

        Object.entries(deps).forEach(([fieldName, [depField, expectedDepFieldValue]]) => {
          // Skip omitted fields
          if (omitted?.includes(fieldName)) return

          const actualDepFieldValue = get(parent, depField)
          const sourceFieldPath = path
            ? utils.removeRootSymbol(utils.resolve(path, fieldName))
            : fieldName

          // Skip if dependency condition is met
          if (isEqual(actualDepFieldValue, expectedDepFieldValue)) {
            hiddenPaths.value.delete(sourceFieldPath) // Unhide the field
            onChange()
            return
          }

          hiddenPaths.value.add(sourceFieldPath) // Mark field as hidden
          onChange()
        })
      },
      { deep: true, immediate: true },
    )

    // Clean up on unmount
    onBeforeUnmount(() => {
      const path = toValue(fieldPath)
      delete registry.value[path]
    })

    return computedRules
  }

  function isFieldHidden(fieldPath: string): boolean {
    return hiddenPaths.value.has(fieldPath)
  }

  return {
    useCurrentRules,
    createComputedRules,
    hiddenPaths: readonly(hiddenPaths),
    isFieldHidden,
  }
}
