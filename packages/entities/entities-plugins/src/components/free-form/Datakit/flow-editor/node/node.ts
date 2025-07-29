import { createI18n } from '@kong-ui-public/i18n'
import {
  CodeblockIcon,
  GatewayIcon,
  NetworkIcon,
  StackIcon,
  VitalsIcon,
} from '@kong/icons'
import english from '../../../../../locales/en.json'
import type {
  FieldId,
  ImplicitNodeName,
  ImplicitNodeType,
  NodeInstance,
  NodeId,
  NodeMeta,
  NodeName,
  NodeType,
  ConfigNodeType,
  FieldName,
} from '../../types'

const { t } = createI18n<typeof english>('en-us', english)

export function getNodeTypeDescription(type: NodeType): string {
  return t(`plugins.free-form.datakit.flow_editor.node_types.${type}.description`)
}

function getNodeTypeSummary(type: ConfigNodeType): string {
  return t(`plugins.free-form.datakit.flow_editor.node_types.${type}.summary`)
}

export function getNodeTypeName(type: NodeType): string {
  return t(`plugins.free-form.datakit.flow_editor.node_types.${type}.name`)
}

export const CONFIG_NODE_META_MAP: Record<ConfigNodeType, NodeMeta> = {
  call: {
    type: 'call',
    summary: getNodeTypeSummary('call'),
    description: getNodeTypeDescription('call'),
    icon: NetworkIcon,
    fields: {
      input: ['headers', 'body', 'query'] as FieldName[],
      output: ['headers', 'body', 'status'] as FieldName[],
    },
  },
  jq: {
    type: 'jq',
    summary: getNodeTypeSummary('jq'),
    description: getNodeTypeDescription('jq'),
    icon: CodeblockIcon,
  },
  exit: {
    type: 'exit',
    summary: getNodeTypeSummary('exit'),
    description: getNodeTypeDescription('exit'),
    icon: GatewayIcon,
    fields: {
      input: ['headers', 'body'] as FieldName[],
    },
  },
  property: {
    type: 'property',
    summary: getNodeTypeSummary('property'),
    description: getNodeTypeDescription('property'),
    icon: StackIcon,
  },
  static: {
    type: 'static',
    summary: getNodeTypeSummary('static'),
    description: getNodeTypeDescription('static'),
    icon: VitalsIcon,
  },
}

export const IMPLICIT_NODE_META_MAP: Record<ImplicitNodeType, NodeMeta> = {
  request: {
    type: 'request',
    description: getNodeTypeDescription('request'),
    fields: {
      output: ['headers', 'body', 'query'] as FieldName[],
    },
  },
  service_request: {
    type: 'service_request',
    description: getNodeTypeDescription('service_request'),
    fields: {
      input: ['headers', 'body', 'query'] as FieldName[],
    },
  },
  service_response: {
    type: 'service_response',
    description: getNodeTypeDescription('service_response'),
    fields: {
      output: ['headers', 'body'] as FieldName[],
    },
  },
  response: {
    type: 'response',
    description: getNodeTypeDescription('response'),
    fields: {
      input: ['headers', 'body'] as FieldName[],
    },
  },
}

const IMPLICIT_NODE_TYPES = Object.keys(IMPLICIT_NODE_META_MAP) as readonly ImplicitNodeType[]

export const isImplicitName = (name: NodeName): name is ImplicitNodeName =>
  (IMPLICIT_NODE_TYPES as readonly string[]).includes(name)

export const isImplicitType = (type: NodeType): type is ImplicitNodeType =>
  (IMPLICIT_NODE_TYPES as readonly string[]).includes(type)

export const isImplicitNode = (
  node: NodeMeta | NodeInstance,
): node is (NodeMeta | NodeInstance) & { type: ImplicitNodeType } =>
  isImplicitType(node.type)

export const isNodeId = (id?: string): id is NodeId =>
  !!id?.startsWith('node:')

export const isFieldId = (id?: string): id is FieldId =>
  !!id?.startsWith('field:')
