import { parseDocument } from 'yaml'

export interface ConfigExtractor {
  name: string
  extract(content: string): unknown | null
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && !Array.isArray(value) && value !== null
}

export const deckExtractor: ConfigExtractor = {
  name: 'decK',
  extract(content: string): unknown | null {
    try {
      const doc = parseDocument(content, { schema: 'yaml-1.1' })
      if (doc.errors.length) return null
      const parsed = doc.toJS()
      if (isObject(parsed) && Array.isArray(parsed.plugins)) {
        const plugin = parsed.plugins.find(
          (p: unknown) => isObject(p) && p.name === 'datakit',
        )
        return plugin || null
      }
      return null
    } catch {
      return null
    }
  },
}

export const kicExtractor: ConfigExtractor = {
  name: 'KIC',
  extract(content: string): unknown | null {
    let yamlContent = content
    // Match echo "..." | kubectl or echo '...' | kubectl
    const shellMatch = content.match(
      /echo\s+(?:"([\s\S]*?)"|'([\s\S]*?)')\s*\|\s*kubectl/,
    )
    if (shellMatch) {
      yamlContent = shellMatch[1] || shellMatch[2]
    }

    try {
      const doc = parseDocument(yamlContent, { schema: 'yaml-1.1' })
      if (doc.errors.length) return null
      const parsed = doc.toJS()
      if (!isObject(parsed)) return null

      const metadata = isObject(parsed.metadata) ? parsed.metadata : {}
      const pluginName = parsed.plugin || metadata.name

      if (
        // https://developer.konghq.com/kubernetes-ingress-controller/reference/custom-resources/#kongplugin
        // https://developer.konghq.com/kubernetes-ingress-controller/reference/custom-resources/#kongclusterplugin
        (parsed.kind === 'KongPlugin' || parsed.kind === 'KongClusterPlugin') &&
        pluginName === 'datakit'
      ) {
        return parsed || null
      }
      return null
    } catch {
      return null
    }
  },
}

export const curlExtractor: ConfigExtractor = {
  name: 'cURL',
  extract(content: string): unknown | null {
    if (!content.trim().startsWith('curl')) {
      return null
    }

    // Match --data or -d followed by a quoted string (single or double quotes)
    // Handles escaped quotes within the string.
    // Examples:
    //   curl ... --data '{"name": "datakit"}'
    //   curl ... -d "{\"name\": \"datakit\"}"
    // Group 1: Content inside single quotes
    // Group 2: Content inside double quotes
    const dataMatch = content.match(
      /(?:--data|-d)\s+(?:'((?:[^'\\]|\\[\s\S])*)'|"((?:[^"\\]|\\[\s\S])*)")/,
    )
    if (!dataMatch) {
      return null
    }

    let jsonContent = dataMatch[1] || dataMatch[2]

    // If double quoted (Group 2), unescape \" and \\ to simulate shell parsing
    if (dataMatch[2]) {
      jsonContent = jsonContent.replace(/\\(["\\])/g, '$1')
    }

    try {
      const parsed = JSON.parse(jsonContent)
      if (isObject(parsed) && parsed.name === 'datakit') {
        return parsed || null
      }
      return null
    } catch {
      return null
    }
  },
}

export const extractors = [deckExtractor, kicExtractor, curlExtractor]
