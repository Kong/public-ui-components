import type {
  ConfigNodeGroup,
  ConfigNodeGroupMeta,
  ConfigNodeMeta,
  ConfigNodePanelGroup,
  ConfigNodeType,
  FieldId,
  GroupInstance,
  ImplicitNodeName,
  ImplicitNodeType,
  IOMeta,
  NodeInstance,
  NodeId,
  NodeMeta,
  NodeName,
  NodeType,
  NextMeta,
  NodeVisual,
} from '../../types'

import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../locales/en.json'
import { CONFIG_NODE_TYPES } from '../../constants'
import {
  CONFIG_NODE_GROUP_COLORS,
  CONFIG_NODE_ICON_MAP,
  NODE_VISUAL,
} from './node-visual'

const { t } = createI18n<typeof english>('en-us', english)

export function getNodeTypeDescription(type: NodeType): string {
  return t(`plugins.free-form.datakit.flow_editor.node_types.${type}.description`)
}

function getNodeTypeSummary(type: ConfigNodeType): string {
  return t(`plugins.free-form.datakit.flow_editor.node_types.${type}.summary`)
}

function getNodeGroupTitle(group: ConfigNodeGroup): string {
  return t(`plugins.free-form.datakit.flow_editor.node_panel.groups.${group}`)
}

const CONFIG_NODE_CATALOG = [
  {
    type: 'call',
    group: 'external_interaction',
    icon: CONFIG_NODE_ICON_MAP.call,
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
  {
    type: 'jq',
    group: 'data_transformation',
    icon: CONFIG_NODE_ICON_MAP.jq,
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
  {
    type: 'exit',
    group: 'control_flow',
    icon: CONFIG_NODE_ICON_MAP.exit,
    io: {
      input: {
        fields: [
          { name: 'headers' },
          { name: 'body' },
        ],
      } as IOMeta,
    },
  },
  {
    type: 'property',
    group: 'data_value',
    icon: CONFIG_NODE_ICON_MAP.property,
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
  {
    type: 'static',
    group: 'data_value',
    icon: CONFIG_NODE_ICON_MAP.static,
    io: {
      output: {
        fields: [],
        configurable: true,
      },
    },
  },
  {
    type: 'branch',
    group: 'control_flow',
    icon: CONFIG_NODE_ICON_MAP.branch,
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
  },
  {
    type: 'cache',
    group: 'external_interaction',
    icon: CONFIG_NODE_ICON_MAP.cache,
    io: {
      input: {
        fields: [
          { name: 'data' },
          { name: 'key' },
          { name: 'ttl' },
        ],
      } as IOMeta,
      output: {
        fields: [
          { name: 'data' },
          { name: 'hit' },
          { name: 'miss' },
          { name: 'stored' },
        ],
      } as IOMeta,
    },
  },
  {
    type: 'xml_to_json',
    group: 'data_transformation',
    icon: CONFIG_NODE_ICON_MAP.xml_to_json,
    io: {
      input: {
        fields: [],
      },
      output: {
        fields: [],
      },
    },
  },
  {
    type: 'json_to_xml',
    group: 'data_transformation',
    icon: CONFIG_NODE_ICON_MAP.json_to_xml,
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
  {
    type: 'jwt_decode',
    group: 'authentication',
    icon: CONFIG_NODE_ICON_MAP.jwt_decode,
    io: {
      input: {
        fields: [],
      },
      output: {
        fields: [
          { name: 'header' },
          { name: 'payload' },
          { name: 'signature' },
        ],
      } as IOMeta,
    },
  },
  {
    type: 'jwt_sign',
    group: 'authentication',
    icon: CONFIG_NODE_ICON_MAP.jwt_sign,
    io: {
      input: {
        fields: [
          { name: 'claims' },
          { name: 'key' },
        ],
      } as IOMeta,
      output: {
        fields: [
          { name: 'claims' },
          { name: 'header' },
          { name: 'token' },
        ],
      } as IOMeta,
    },
  },
  {
    type: 'jwt_verify',
    group: 'authentication',
    icon: CONFIG_NODE_ICON_MAP.jwt_verify,
    io: {
      input: {
        fields: [
          { name: 'key' },
          { name: 'token' },
        ],
      } as IOMeta,
      output: {
        fields: [
          { name: 'claims' },
          { name: 'header' },
        ],
      } as IOMeta,
    },
  },
] as const satisfies ReadonlyArray<Pick<ConfigNodeMeta, 'type' | 'group' | 'icon' | 'io'>>

export const CONFIG_NODE_META_MAP: Record<ConfigNodeType, ConfigNodeMeta> = Object.fromEntries(
  CONFIG_NODE_CATALOG.map((node) => [
    node.type,
    {
      ...node,
      summary: getNodeTypeSummary(node.type),
      description: getNodeTypeDescription(node.type),
    },
  ]),
) as Record<ConfigNodeType, ConfigNodeMeta>

const CONFIG_NODE_GROUP_ORDER = [
  {
    id: 'external_interaction',
    nodeTypes: ['call', 'cache'],
  },
  {
    id: 'control_flow',
    nodeTypes: ['branch', 'exit'],
  },
  {
    id: 'data_transformation',
    nodeTypes: ['jq', 'xml_to_json', 'json_to_xml'],
  },
  {
    id: 'data_value',
    nodeTypes: ['property', 'static'],
  },
  {
    id: 'authentication',
    nodeTypes: ['jwt_sign', 'jwt_decode', 'jwt_verify'],
  },
] as const satisfies ReadonlyArray<{
  id: ConfigNodeGroup
  nodeTypes: readonly ConfigNodeType[]
}>

export const CONFIG_NODE_GROUP_META_MAP = CONFIG_NODE_GROUP_ORDER.reduce<Record<ConfigNodeGroup, ConfigNodeGroupMeta>>(
  (groups, group) => {
    groups[group.id] = {
      id: group.id,
      title: getNodeGroupTitle(group.id),
      colors: CONFIG_NODE_GROUP_COLORS[group.id],
      nodeTypes: group.nodeTypes,
    }

    return groups
  },
  {} as Record<ConfigNodeGroup, ConfigNodeGroupMeta>,
)

export const CONFIG_NODE_PANEL_GROUPS: readonly ConfigNodePanelGroup[] = CONFIG_NODE_GROUP_ORDER.map(
  (group) => ({
    ...CONFIG_NODE_GROUP_META_MAP[group.id],
    nodes: group.nodeTypes.map((type) => CONFIG_NODE_META_MAP[type]),
  }),
)

export function getConfigNodeGroupMeta(group: ConfigNodeGroup): ConfigNodeGroupMeta {
  return CONFIG_NODE_GROUP_META_MAP[group]
}

export function getNodeVisual(type: NodeType): NodeVisual {
  if (isConfigType(type)) {
    const meta = CONFIG_NODE_META_MAP[type]

    return {
      icon: meta.icon,
      colors: CONFIG_NODE_GROUP_META_MAP[meta.group].colors,
    }
  }

  return NODE_VISUAL[type]
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
