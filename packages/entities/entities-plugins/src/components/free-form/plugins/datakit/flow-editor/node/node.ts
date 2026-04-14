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
} from '../../types'

import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../../locales/en.json'
import { CONFIG_NODE_TYPES } from '../../constants'
import {
  CONFIG_NODE_GROUP_VISUAL_CATALOG,
  getConfigNodeGroupColors,
  IMPLICIT_NODE_VISUALS,
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

type ConfigNodeCatalogNode = Pick<ConfigNodeMeta, 'io'>

const CONFIG_NODE_CATALOG: Record<ConfigNodeType, ConfigNodeCatalogNode> = {
  call: {
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
    io: {
      output: {
        fields: [],
        configurable: true,
      },
    },
  },
  branch: {
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
  cache: {
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
  xml_to_json: {
    io: {
      input: {
        fields: [],
      },
      output: {
        fields: [],
      },
    },
  },
  json_to_xml: {
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
  jwt_decode: {
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
  jwt_sign: {
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
  jwt_verify: {
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
}

function createConfigNodeGroupMeta(group: typeof CONFIG_NODE_GROUP_VISUAL_CATALOG[number]): ConfigNodeGroupMeta {
  return {
    id: group.id,
    title: getNodeGroupTitle(group.id),
    colors: getConfigNodeGroupColors(group.id),
    nodeTypes: group.nodes.map(({ type }) => type),
  }
}

function createConfigNodeMeta(
  group: typeof CONFIG_NODE_GROUP_VISUAL_CATALOG[number],
  node: typeof CONFIG_NODE_GROUP_VISUAL_CATALOG[number]['nodes'][number],
): ConfigNodeMeta {
  return {
    ...CONFIG_NODE_CATALOG[node.type],
    type: node.type,
    icon: node.icon,
    group: group.id,
    summary: getNodeTypeSummary(node.type),
    description: getNodeTypeDescription(node.type),
  }
}

export const CONFIG_NODE_GROUP_META_MAP = CONFIG_NODE_GROUP_VISUAL_CATALOG.reduce<Record<ConfigNodeGroup, ConfigNodeGroupMeta>>(
  (groups, group) => {
    groups[group.id] = createConfigNodeGroupMeta(group)

    return groups
  },
  {} as Record<ConfigNodeGroup, ConfigNodeGroupMeta>,
)

export const CONFIG_NODE_META_MAP = CONFIG_NODE_GROUP_VISUAL_CATALOG.reduce<Record<ConfigNodeType, ConfigNodeMeta>>(
  (nodes, group) => {
    for (const node of group.nodes) {
      nodes[node.type] = createConfigNodeMeta(group, node)
    }

    return nodes
  },
  {} as Record<ConfigNodeType, ConfigNodeMeta>,
)

export const CONFIG_NODE_PANEL_GROUPS: readonly ConfigNodePanelGroup[] = CONFIG_NODE_GROUP_VISUAL_CATALOG.map(
  (group) => ({
    ...CONFIG_NODE_GROUP_META_MAP[group.id],
    nodes: group.nodes.map(({ type }) => CONFIG_NODE_META_MAP[type]),
  }),
)

export function getConfigNodeGroupMeta(group: ConfigNodeGroup): ConfigNodeGroupMeta {
  return CONFIG_NODE_GROUP_META_MAP[group]
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
