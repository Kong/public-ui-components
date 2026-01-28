import { IMPLICIT_NODE_NAMES } from '../constants'
import { getNodeIo, type NodeIO, type GraphValidationMode } from './node-io'

type ParsedConfig = {
  config?: {
    nodes?: Array<{ name?: unknown; type?: unknown; values?: Record<string, unknown> }>
    resources?: { vault?: Record<string, unknown> | null }
  }
}

type DatakitIoIndex = {
  nodeNames: string[]
  implicitNames: string[]
  nodeTypeByName: Map<string, string>
  getNodeIoByName: (name: string) => NodeIO | undefined
  getDynamicOutputFields: (nodeName: string, nodeType: string) => string[]
}

const IMPLICIT_NAME_SET = new Set<string>(IMPLICIT_NODE_NAMES)

function getNodeNamesFromDoc(parsed: ParsedConfig | null): string[] {
  const nodes = parsed?.config?.nodes
  if (!Array.isArray(nodes)) return []
  const names: string[] = []
  for (const node of nodes) {
    if (node && typeof node.name === 'string') {
      names.push(node.name)
    }
  }
  return Array.from(new Set(names))
}

function getNodeTypeByName(parsed: ParsedConfig | null): Map<string, string> {
  const nodes = parsed?.config?.nodes
  const map = new Map<string, string>()
  if (!Array.isArray(nodes)) return map
  for (const node of nodes) {
    if (node && typeof node.name === 'string' && typeof node.type === 'string') {
      map.set(node.name, node.type)
    }
  }
  return map
}

function getDynamicOutputFields(
  parsed: ParsedConfig | null,
  nodeName: string,
  nodeType: string,
): string[] {
  if (!parsed?.config) return []

  if (nodeType === 'static') {
    const node = parsed.config.nodes?.find((entry) => entry?.name === nodeName)
    if (node && node.values && typeof node.values === 'object') {
      return Object.keys(node.values)
    }
  }

  if (nodeType === 'vault') {
    const vault = parsed.config.resources?.vault
    if (vault && typeof vault === 'object') {
      return Object.keys(vault)
    }
  }

  return []
}

export function getDatakitIoIndex(
  parsed: ParsedConfig | null,
  mode: GraphValidationMode,
): DatakitIoIndex {
  const nodeNames = getNodeNamesFromDoc(parsed)
  const nodeTypeByName = getNodeTypeByName(parsed)
  const implicitNames = Array.from(IMPLICIT_NAME_SET)

  return {
    nodeNames,
    implicitNames,
    nodeTypeByName,
    getNodeIoByName: (name: string) => {
      const nodeType = nodeTypeByName.get(name) ?? name
      return getNodeIo(nodeType as any, mode)
    },
    getDynamicOutputFields: (nodeName: string, nodeType: string) =>
      getDynamicOutputFields(parsed, nodeName, nodeType),
  }
}
