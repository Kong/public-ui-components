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
  NodeColors,
  NodeMeta,
  NodeName,
  NodeType,
  NextMeta,
  NodeVisual,
} from '../../types'

import {
  KUI_COLOR_BACKGROUND_DECORATIVE_AQUA_WEAKEST,
  KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE_WEAKEST,
  KUI_COLOR_BACKGROUND_WARNING_WEAKEST,
  KUI_COLOR_TEXT_DECORATIVE_AQUA,
  KUI_COLOR_TEXT_DECORATIVE_PURPLE,
  KUI_COLOR_TEXT_PRIMARY,
  KUI_COLOR_TEXT_PRIMARY_WEAKEST,
  KUI_COLOR_TEXT_SUCCESS,
  KUI_COLOR_TEXT_SUCCESS_WEAKEST,
  KUI_COLOR_TEXT_WARNING,
} from '@kong/design-tokens'
import {
  ArrowSplitIcon,
  CachedIcon,
  CodeIcon,
  CodeblockIcon,
  DataObjectIcon,
  DeployIcon,
  EditSquareIcon,
  GatewayIcon,
  NetworkIcon,
  StackIcon,
} from '@kong/icons'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../locales/en.json'
import { CONFIG_NODE_TYPES } from '../../constants'
import { IMPLICIT_NODE_VISUALS } from './node-visual'
import JwtDecodeIcon from './icons/JwtDecodeIcon.vue'
import JwtVerifyIcon from './icons/JwtVerifyIcon.vue'

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

type ConfigNodeCatalogNode = Pick<ConfigNodeMeta, 'type' | 'icon' | 'io'>

type ConfigNodeGroupCatalog = {
  id: ConfigNodeGroup
  colors: NodeColors
  nodes: readonly ConfigNodeCatalogNode[]
}

const CONFIG_NODE_GROUP_CATALOG = [
  {
    id: 'external_interaction',
    colors: {
      foreground: KUI_COLOR_TEXT_WARNING,
      background: KUI_COLOR_BACKGROUND_WARNING_WEAKEST,
    },
    nodes: [
      {
        type: 'call',
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
      {
        type: 'cache',
        icon: CachedIcon,
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
    ],
  },
  {
    id: 'control_flow',
    colors: {
      foreground: KUI_COLOR_TEXT_DECORATIVE_AQUA,
      background: KUI_COLOR_BACKGROUND_DECORATIVE_AQUA_WEAKEST,
    },
    nodes: [
      {
        type: 'branch',
        icon: ArrowSplitIcon,
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
        type: 'exit',
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
    ],
  },
  {
    id: 'data_transformation',
    colors: {
      foreground: KUI_COLOR_TEXT_DECORATIVE_PURPLE,
      background: KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE_WEAKEST,
    },
    nodes: [
      {
        type: 'jq',
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
      {
        type: 'xml_to_json',
        icon: DataObjectIcon,
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
        icon: CodeIcon,
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
    ],
  },
  {
    id: 'data_value',
    colors: {
      foreground: KUI_COLOR_TEXT_SUCCESS,
      background: KUI_COLOR_TEXT_SUCCESS_WEAKEST,
    },
    nodes: [
      {
        type: 'property',
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
      {
        type: 'static',
        icon: DeployIcon,
        io: {
          output: {
            fields: [],
            configurable: true,
          },
        },
      },
    ],
  },
  {
    id: 'authentication',
    colors: {
      foreground: KUI_COLOR_TEXT_PRIMARY,
      background: KUI_COLOR_TEXT_PRIMARY_WEAKEST,
    },
    nodes: [
      {
        type: 'jwt_sign',
        icon: EditSquareIcon,
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
        type: 'jwt_decode',
        icon: JwtDecodeIcon,
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
        type: 'jwt_verify',
        icon: JwtVerifyIcon,
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
    ],
  },
] as const satisfies readonly ConfigNodeGroupCatalog[]

function createConfigNodeGroupMeta(group: ConfigNodeGroupCatalog): ConfigNodeGroupMeta {
  return {
    id: group.id,
    title: getNodeGroupTitle(group.id),
    colors: group.colors,
    nodeTypes: group.nodes.map(({ type }) => type),
  }
}

function createConfigNodeMeta(group: ConfigNodeGroupCatalog, node: ConfigNodeCatalogNode): ConfigNodeMeta {
  return {
    ...node,
    group: group.id,
    summary: getNodeTypeSummary(node.type),
    description: getNodeTypeDescription(node.type),
  }
}

export const CONFIG_NODE_GROUP_META_MAP = CONFIG_NODE_GROUP_CATALOG.reduce<Record<ConfigNodeGroup, ConfigNodeGroupMeta>>(
  (groups, group) => {
    groups[group.id] = createConfigNodeGroupMeta(group)

    return groups
  },
  {} as Record<ConfigNodeGroup, ConfigNodeGroupMeta>,
)

export const CONFIG_NODE_META_MAP = CONFIG_NODE_GROUP_CATALOG.reduce<Record<ConfigNodeType, ConfigNodeMeta>>(
  (nodes, group) => {
    for (const node of group.nodes) {
      nodes[node.type] = createConfigNodeMeta(group, node)
    }

    return nodes
  },
  {} as Record<ConfigNodeType, ConfigNodeMeta>,
)

export const CONFIG_NODE_PANEL_GROUPS: readonly ConfigNodePanelGroup[] = CONFIG_NODE_GROUP_CATALOG.map(
  (group) => ({
    ...CONFIG_NODE_GROUP_META_MAP[group.id],
    nodes: group.nodes.map(({ type }) => CONFIG_NODE_META_MAP[type]),
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

  return IMPLICIT_NODE_VISUALS[type]
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
    ...IMPLICIT_NODE_VISUALS.request,
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
    ...IMPLICIT_NODE_VISUALS.service_request,
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
    ...IMPLICIT_NODE_VISUALS.service_response,
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
    ...IMPLICIT_NODE_VISUALS.response,
  },
  vault: {
    type: 'vault',
    io: {
      output: {
        fields: [],
        configurable: true,
      },
    },
    ...IMPLICIT_NODE_VISUALS.vault,
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
