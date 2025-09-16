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
  IOMeta,
} from '../../types'

import { createI18n } from '@kong-ui-public/i18n'
import {
  CodeblockIcon,
  GatewayIcon,
  NetworkIcon,
  StackIcon,
  VitalsIcon,
} from '@kong/icons'
import english from '../../../../../locales/en.json'
import { CONFIG_NODE_TYPES } from '../../constants'
import BranchIcon from '../icons/BranchIcon.vue'
import CachedIcon from '../icons/CachedIcon.vue'

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
    io: {
      input: {
        fields: [
          { name: 'headers' },
          { name: 'body' },
          { name: 'query' },
        ],
      } as IOMeta,
      output: {
        fields: [
          { name: 'headers' },
          { name: 'body' },
          { name: 'status' },
        ],
      } as IOMeta,
    },
  },
  jq: {
    type: 'jq',
    summary: getNodeTypeSummary('jq'),
    description: getNodeTypeDescription('jq'),
    icon: CodeblockIcon,
    io: {
      input: {
        fields: [],
        configurable: true,
      },
      output: {
        fields: [],
      },
    },
  },
  exit: {
    type: 'exit',
    summary: getNodeTypeSummary('exit'),
    description: getNodeTypeDescription('exit'),
    icon: GatewayIcon,
    io: {
      input: {
        fields: [
          { name: 'headers' },
          { name: 'body' },
        ],
      } as IOMeta,
    },
  },
  property: {
    type: 'property',
    summary: getNodeTypeSummary('property'),
    description: getNodeTypeDescription('property'),
    icon: StackIcon,
    io: {
      input: {
        fields: [],
        configurable: true,
      },
      output: {
        fields: [],
      },
    },
  },
  static: {
    type: 'static',
    summary: getNodeTypeSummary('static'),
    description: getNodeTypeDescription('static'),
    icon: VitalsIcon,
    io: {
      output: {
        fields: [],
        configurable: true,
      },
    },
  },
  branch: {
    type: 'branch',
    summary: getNodeTypeSummary('branch'),
    description: getNodeTypeDescription('branch'),
    icon: BranchIcon,
  },
  cache: {
    type: 'cache',
    summary: getNodeTypeSummary('cache'),
    description: getNodeTypeDescription('cache'),
    icon: CachedIcon,
  },
}

export const IMPLICIT_NODE_META_MAP: Record<ImplicitNodeType, NodeMeta> = {
  request: {
    type: 'request',
    description: getNodeTypeDescription('request'),
    io: {
      output: {
        fields: [
          { name: 'headers' },
          { name: 'body' },
          { name: 'query' },
        ],
      } as IOMeta,
    },
  },
  service_request: {
    type: 'service_request',
    description: getNodeTypeDescription('service_request'),
    io: {
      input: {
        fields: [
          { name: 'headers' },
          { name: 'body' },
          { name: 'query' },
        ],
      } as IOMeta,
    },
  },
  service_response: {
    type: 'service_response',
    description: getNodeTypeDescription('service_response'),
    io: {
      output: {
        fields: [
          { name: 'headers' },
          { name: 'body' },
        ],
      } as IOMeta,
    },
  },
  response: {
    type: 'response',
    description: getNodeTypeDescription('response'),
    io: {
      input: {
        fields: [
          { name: 'headers' },
          { name: 'body' },
        ],
      } as IOMeta,
    },
  },
}

const IMPLICIT_NODE_TYPES = Object.keys(IMPLICIT_NODE_META_MAP) as readonly ImplicitNodeType[]

export const isImplicitName = (name: NodeName): name is ImplicitNodeName =>
  (IMPLICIT_NODE_TYPES as readonly string[]).includes(name)

export const isImplicitType = (type: NodeType): type is ImplicitNodeType =>
  (IMPLICIT_NODE_TYPES as readonly string[]).includes(type)

export const isConfigType = (type: NodeType): type is ConfigNodeType =>
  (CONFIG_NODE_TYPES as readonly string[]).includes(type)

export const isImplicitNode = (
  node: NodeMeta | NodeInstance,
): node is (NodeMeta | NodeInstance) & { type: ImplicitNodeType } =>
  isImplicitType(node.type)

export const isNodeId = (id?: string): id is NodeId =>
  !!id?.startsWith('node:')

export const isFieldId = (id?: string): id is FieldId =>
  !!id?.startsWith('field:')
