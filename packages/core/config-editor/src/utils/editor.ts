import type { ASTNode, JSONSchema, PropertyASTNode } from '@kong/vscode-json-languageservice'
import type * as Monaco from 'monaco-editor'

export const setupMonaco = async () => {
  const [EditorWorker, JSONWorker] = await Promise.all([
    import('@kong/monaco-editor/esm/vs/editor/editor.worker?worker').then(module => module.default),
    import('@kong/monaco-editor/esm/vs/language/json/json.worker?worker').then(module => module.default),
  ])

  window.MonacoEnvironment = {
    getWorker(_: any, label: string) {
      if (label === 'json') {
        return new JSONWorker()
      }
      return new EditorWorker()
    },
  }

  return await import('monaco-editor') as typeof Monaco
}

const requiredValuePlaceholder = '///*___required___*///'

const prepareData = (schema: JSONSchema) => {
  if (schema.type !== 'object') {
    return schema.default
  }

  // if (!schema.required || schema.required.length === 0) {
  //   return {}
  // }

  const requiredPropertyKeys = new Set(schema.required)

  const properties = schema.properties
  if (!properties) {
    return {}
    // throw new Error(`schema.required is not empty but schema.properties is missing: ${JSON.stringify(schema)}`)
  }

  return Object.entries(properties).sort(([aKey], [bKey]) => {
    const requireA = requiredPropertyKeys.has(aKey)
    const requireB = requiredPropertyKeys.has(bKey)

    if (requireA !== requireB) {
      return requireA ? -1 : 1
    }

    return aKey.localeCompare(bKey)
  }).reduce<Record<string, any>>((fields, [key, property]) => {
    if (typeof property === 'boolean') {
      // Throw here as we don't generate JSON schemas with refs
      throw new Error(`schema.properties["${key}"] is a boolean instead of an object: ${JSON.stringify(schema)}`)
    }

    /**
     * JSON schemas should never use `undefined` as default values.
     * `undefined` indicates the missing of a default value.
     */
    if (property.default !== undefined) {
      fields[key] = prepareData(property)
    } else if (requiredPropertyKeys.has(key)) {
      fields[key] = property.type === 'object' ? prepareData(property) : requiredValuePlaceholder
    }

    return fields
  }, {})
}

export const prepareModel = (schema: JSONSchema) => {
  const pinnedFields = ['name', 'enabled', 'protocols', 'tags', 'service', 'route', 'consumer', 'consumer_group', 'config']
  const model = Object.fromEntries(
    Object.entries(prepareData(schema)).sort(([aKey], [bKey]) => {
      const pinnedA = pinnedFields.includes(aKey)
      const pinnedB = pinnedFields.includes(bKey)

      if (pinnedA && pinnedB) {
        return pinnedFields.indexOf(aKey) - pinnedFields.indexOf(bKey)
      } else if (pinnedA !== pinnedB) {
        return pinnedA ? -1 : 1
      }

      return aKey.localeCompare(bKey)
    }),
  )

  return JSON.stringify(model, null, 2).replaceAll(`"${requiredValuePlaceholder}"`, '/*required*/')
}

export const obtainPropertyChain = (node?: ASTNode, chain: PropertyASTNode[] = []) => {
  if (node) {
    if (node.type === 'property') {
      chain.unshift(node)
    }
    if (node.parent) {
      obtainPropertyChain(node.parent, chain)
    }
  }
  return chain
}
