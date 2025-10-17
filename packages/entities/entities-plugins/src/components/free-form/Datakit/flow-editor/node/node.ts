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
  NextMeta,
  GroupInstance,
} from '../../types'

import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../locales/en.json'
import { CONFIG_NODE_TYPES } from '../../constants'
import { NODE_VISUAL } from './node-visual'

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
    ...NODE_VISUAL.call,
  },
  jq: {
    type: 'jq',
    summary: getNodeTypeSummary('jq'),
    description: getNodeTypeDescription('jq'),
    io: {
      input: {
        fields: [],
        configurable: true,
      },
      output: {
        fields: [],
      },
    },
    ...NODE_VISUAL.jq,
  },
  exit: {
    type: 'exit',
    summary: getNodeTypeSummary('exit'),
    description: getNodeTypeDescription('exit'),
    io: {
      input: {
        fields: [
          { name: 'headers' },
          { name: 'body' },
        ],
      } as IOMeta,
    },
    ...NODE_VISUAL.exit,
  },
  property: {
    type: 'property',
    summary: getNodeTypeSummary('property'),
    description: getNodeTypeDescription('property'),
    io: {
      input: {
        fields: [],
        configurable: true,
      },
      output: {
        fields: [],
      },
    },
    ...NODE_VISUAL.property,
  },
  static: {
    type: 'static',
    summary: getNodeTypeSummary('static'),
    description: getNodeTypeDescription('static'),
    io: {
      output: {
        fields: [],
        configurable: true,
      },
    },
    ...NODE_VISUAL.static,
  },
  branch: {
    type: 'branch',
    summary: getNodeTypeSummary('branch'),
    description: getNodeTypeDescription('branch'),
    io: {
      input: {
        fields: [],
      },
      next: {
        branches: [
          { name: 'then' },
          { name: 'else' },
        ],
      } as NextMeta,
    },
    ...NODE_VISUAL.branch,
  },
  cache: {
    type: 'cache',
    summary: getNodeTypeSummary('cache'),
    description: getNodeTypeDescription('cache'),
    ...NODE_VISUAL.cache,
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
    ...NODE_VISUAL.request,
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
    ...NODE_VISUAL.service_request,
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
    ...NODE_VISUAL.service_response,
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
    ...NODE_VISUAL.response,
  },
  vault: {
    type: 'vault',
    io: {
      output: {
        fields: [],
        configurable: true,
      },
    },
    ...NODE_VISUAL.vault,
    hidden: true,
  },
}

const IMPLICIT_NODE_TYPES = Object.keys(IMPLICIT_NODE_META_MAP) as readonly ImplicitNodeType[]

export const isImplicitName = (name: NodeName): name is ImplicitNodeName =>
  (IMPLICIT_NODE_TYPES as readonly string[]).includes(name)

export const isNodeType = (type: string): type is NodeType =>
  ([...IMPLICIT_NODE_TYPES, ...CONFIG_NODE_TYPES] as readonly string[]).includes(type)

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

export const isGroupInstance = (obj: NodeInstance | GroupInstance): obj is GroupInstance =>
  Object.prototype.hasOwnProperty.call(obj, 'ownerId')
