import type { NodeType } from './strict'
import { CONFIG_NODE_TYPES, IMPLICIT_NODE_NAMES } from '../constants'
import { getNodeFieldIndex, type FieldIndexEntry } from './node-field-index'

export type NodeIO = FieldIndexEntry
export type GraphValidationMode = 'strict' | 'compat'

const IMPLICIT_NODE_IO: Record<string, NodeIO> = {
  request: {
    outputs: ['headers', 'body', 'query'],
  },
  service_request: {
    inputs: ['headers', 'body', 'query'],
  },
  service_response: {
    outputs: ['headers', 'body'],
  },
  response: {
    inputs: ['headers', 'body'],
  },
  vault: {
    outputs: null,
  },
}

const CONFIG_NODE_TYPE_SET = new Set<string>(CONFIG_NODE_TYPES)
const IMPLICIT_NODE_NAME_SET = new Set<string>(IMPLICIT_NODE_NAMES)

export function getNodeIo(
  type: NodeType,
  mode: GraphValidationMode,
): NodeIO | undefined {
  if (IMPLICIT_NODE_NAME_SET.has(type)) {
    return IMPLICIT_NODE_IO[type]
  }

  if (CONFIG_NODE_TYPE_SET.has(type)) {
    const index = getNodeFieldIndex(mode)
    return index.get(type)
  }

  return undefined
}
