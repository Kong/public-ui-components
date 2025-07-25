import { createI18n } from '@kong-ui-public/i18n'
import {
  KUI_COLOR_BACKGROUND_DANGER_WEAKEST,
  KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE_WEAKEST,
  KUI_COLOR_BACKGROUND_PRIMARY_WEAKEST,
  KUI_COLOR_BACKGROUND_SUCCESS_WEAKEST,
  KUI_COLOR_BACKGROUND_WARNING_WEAKEST,
  KUI_COLOR_TEXT_DANGER,
  KUI_COLOR_TEXT_DECORATIVE_PURPLE,
  KUI_COLOR_TEXT_PRIMARY,
  KUI_COLOR_TEXT_SUCCESS,
  KUI_COLOR_TEXT_WARNING,
} from '@kong/design-tokens'
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

export function getNodeTypeDescription(type: NodeType): string {
  return t(`plugins.free-form.datakit.flow_editor.node_types.${type}.description`)
}

function getNodeTypeSummary(type: UserNodeType): string {
  return t(`plugins.free-form.datakit.flow_editor.node_types.${type}.summary`)
}

export function getNodeTypeName(type: NodeType): string {
  return t(`plugins.free-form.datakit.flow_editor.node_types.${type}.name`)
}

export const USER_NODE_META_MAP = {
  call: {
    type: 'call',
    summary: getNodeTypeSummary('call'),
    description: getNodeTypeDescription('call'),
    icon: {
      component: NetworkIcon,
      colors: {
        background: KUI_COLOR_BACKGROUND_WARNING_WEAKEST,
        foreground: KUI_COLOR_TEXT_WARNING,
      },
    },
    fields: {
      input: ['headers', 'body', 'query'],
      output: ['headers', 'body', 'status'],
    },
  },
  jq: {
    type: 'jq',
    summary: getNodeTypeSummary('jq'),
    description: getNodeTypeDescription('jq'),
    icon: {
      component: CodeblockIcon,
      colors: {
        background: KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE_WEAKEST,
        foreground: KUI_COLOR_TEXT_DECORATIVE_PURPLE,
      },
    },
  },
  exit: {
    type: 'exit',
    summary: getNodeTypeSummary('exit'),
    description: getNodeTypeDescription('exit'),
    icon: {
      component: GatewayIcon,
      colors: {
        background: KUI_COLOR_BACKGROUND_DANGER_WEAKEST,
        foreground: KUI_COLOR_TEXT_DANGER,
      },
    },
    fields: {
      input: ['headers', 'body'],
    },
  },
  property: {
    type: 'property',
    summary: getNodeTypeSummary('property'),
    description: getNodeTypeDescription('property'),
    icon: {
      component: StackIcon,
      colors: {
        background: KUI_COLOR_BACKGROUND_SUCCESS_WEAKEST,
        foreground: KUI_COLOR_TEXT_SUCCESS,
      },
    },
  },
  static: {
    type: 'static',
    summary: getNodeTypeSummary('static'),
    description: getNodeTypeDescription('static'),
    icon: {
      component: VitalsIcon,
      colors: {
        background: KUI_COLOR_BACKGROUND_PRIMARY_WEAKEST,
        foreground: KUI_COLOR_TEXT_PRIMARY,
      },
    },
  },
} as const satisfies Record<UserNodeType, NodeMeta>

export const IMPLICIT_NODE_META_MAP = {
  request: {
    type: 'request',
    description: getNodeTypeDescription('request'),
    fields: {
      output: ['headers', 'body', 'query'],
    },
  },
  service_request: {
    type: 'service_request',
    description: getNodeTypeDescription('service_request'),
    fields: {
      input: ['headers', 'body', 'query'],
    },
  },
  service_response: {
    type: 'service_response',
    description: getNodeTypeDescription('service_response'),
    fields: {
      output: ['headers', 'body'],
    },
  },
  response: {
    type: 'response',
    description: getNodeTypeDescription('response'),
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
  id: isImplicitNode(data) ? `implicit:${data.type}` : `user:${data.type}:${data.name}`, // TODO: Replace this with an edit-agnostic ID
  type: 'flow', // Hardcoded
  position: data.position,
  data,
})

export const createImplicitNode = (type: ImplicitNodeType, init?: Partial<Omit<NodeData, 'name' | 'phase'>>): Node<NodeData> => {
  return createNode({
    // Defaults
    expanded: {},
    position: { x: 0, y: 0 },

    ...IMPLICIT_NODE_META_MAP[type],

    // Preserved
    name: type,
    phase: type === 'request' || type === 'service_request' ? 'request' : 'response',

    ...init,
  })
}

export type PartiallyRequired<T, K extends keyof T> = Partial<Omit<T, K>> & Required<Pick<T, K>>

export const createUserNode = (type: UserNodeType, init: PartiallyRequired<NodeData, 'name' | 'phase'>): Node<NodeData> => {
  return createNode({
    // Defaults
    expanded: {},
    fields: {},
    position: { x: 0, y: 0 },

    ...USER_NODE_META_MAP[type],
    ...init,
  })
}
