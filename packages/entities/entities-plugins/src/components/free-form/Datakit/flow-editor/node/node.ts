import { createI18n } from '@kong-ui-public/i18n'
import {
  CodeblockIcon,
  GatewayIcon,
  NetworkIcon,
  StackIcon,
  VitalsIcon,
} from '@kong/icons'
import type { Node } from '@vue-flow/core'
import english from '../../../../../locales/en.json'
import type {
  ImplicitNodeType,
  NodeData,
  NodeMeta,
  NodeType,
  UserNodeType,
} from '../../types'

const { t } = createI18n<typeof english>('en-us', english)

export function getNodeDescription(type: NodeType): string {
  return t(`plugins.free-form.datakit.flow_editor.node_types.${type}.description`)
}

function getNodeSummary(type: UserNodeType): string {
  return t(`plugins.free-form.datakit.flow_editor.node_types.${type}.summary`)
}

export function getNodeName(type: NodeType): string {
  return t(`plugins.free-form.datakit.flow_editor.node_types.${type}.name`)
}

export const USER_NODE_META_MAP = {
  call: {
    type: 'call',
    summary: getNodeSummary('call'),
    description: getNodeDescription('call'),
    icon: NetworkIcon,
    fields: {
      input: ['headers', 'body', 'query'],
      output: ['headers', 'body', 'status'],
    },
  },
  jq: {
    type: 'jq',
    summary: getNodeSummary('jq'),
    description: getNodeDescription('jq'),
    icon: CodeblockIcon,
  },
  exit: {
    type: 'exit',
    summary: getNodeSummary('exit'),
    description: getNodeDescription('exit'),
    icon: GatewayIcon,
    fields: {
      output: ['headers', 'body'],
    },
  },
  property: {
    type: 'property',
    summary: getNodeSummary('property'),
    description: getNodeDescription('property'),
    icon: StackIcon,
  },
  static: {
    type: 'static',
    summary: getNodeSummary('static'),
    description: getNodeDescription('static'),
    icon: VitalsIcon,
  },
} as const satisfies Record<UserNodeType, NodeMeta>

export const IMPLICIT_NODE_META_MAP = {
  request: {
    type: 'request',
    description: getNodeDescription('request'),
    fields: {
      output: ['headers', 'body', 'query'],
    },
  },
  service_request: {
    type: 'service_request',
    description: getNodeDescription('service_request'),
    fields: {
      input: ['headers', 'body', 'query'],
    },
  },
  service_response: {
    type: 'service_response',
    description: getNodeDescription('service_response'),
    fields: {
      output: ['headers', 'body'],
    },
  },
  response: {
    type: 'response',
    description: getNodeDescription('response'),
    fields: {
      input: ['headers', 'body'],
    },
  },
} as const satisfies Record<ImplicitNodeType, NodeMeta>

const IMPLICIT_NODE_TYPES = Object.keys(IMPLICIT_NODE_META_MAP) as readonly ImplicitNodeType[]

export const isImplicitNodeType = (type: NodeType): type is ImplicitNodeType =>
  (IMPLICIT_NODE_TYPES as readonly string[]).includes(type)

export const isImplicitNode = (
  node: NodeMeta | NodeData,
): node is (NodeMeta | NodeData) & { type: ImplicitNodeType } =>
  (IMPLICIT_NODE_TYPES as readonly string[]).includes(node.type)

export const createNode = (data: NodeData): Node<NodeData> => ({
  id: isImplicitNode(data) ? `implicit:${data.type}` : `user:${data.type}:${data.name}`,
  type: 'flow', // Hardcoded
  position: data.position,
  data,
})

export const createImplicitNode = (type: ImplicitNodeType, dataOverrides?: Partial<NodeData>): Node<NodeData> => {
  return createNode({
    ...IMPLICIT_NODE_META_MAP[type],
    name: type,
    phase: type === 'request' || type === 'service_request' ? 'request' : 'response',
    expanded: {},
    position: { x: 0, y: 0 },
    ...dataOverrides,
  })
}
