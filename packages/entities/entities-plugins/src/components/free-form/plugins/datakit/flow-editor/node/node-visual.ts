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
  CloudIcon,
  CodeIcon,
  CodeblockIcon,
  DataObjectIcon,
  DeployIcon,
  EditSquareIcon,
  GatewayIcon,
  KeyIcon,
  NetworkIcon,
  StackIcon,
} from '@kong/icons'
import type {
  ConfigNodeGroup,
  ConfigNodeType,
  ImplicitNodeType,
  NodeColors,
  NodeType,
  NodeVisual,
} from '../../types'
import JwtDecodeIcon from './icons/JwtDecodeIcon.vue'
import JwtVerifyIcon from './icons/JwtVerifyIcon.vue'

type ConfigNodeVisual = {
  type: ConfigNodeType
  icon: NodeVisual['icon']
}

type ConfigNodeGroupVisual = {
  id: ConfigNodeGroup
  colors: NodeColors
  nodes: readonly ConfigNodeVisual[]
}

export const CONFIG_NODE_GROUP_VISUAL_CATALOG = [
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
      },
      {
        type: 'cache',
        icon: CachedIcon,
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
      },
      {
        type: 'exit',
        icon: GatewayIcon,
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
      },
      {
        type: 'xml_to_json',
        icon: DataObjectIcon,
      },
      {
        type: 'json_to_xml',
        icon: CodeIcon,
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
      },
      {
        type: 'static',
        icon: DeployIcon,
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
      },
      {
        type: 'jwt_decode',
        icon: JwtDecodeIcon,
      },
      {
        type: 'jwt_verify',
        icon: JwtVerifyIcon,
      },
    ],
  },
] as const satisfies readonly ConfigNodeGroupVisual[]

const CONFIG_NODE_VISUAL_MAP = CONFIG_NODE_GROUP_VISUAL_CATALOG.reduce<Record<ConfigNodeType, NodeVisual>>(
  (visuals, group) => {
    for (const node of group.nodes) {
      visuals[node.type] = {
        icon: node.icon,
        colors: group.colors,
      }
    }

    return visuals
  },
  {} as Record<ConfigNodeType, NodeVisual>,
)

export const IMPLICIT_NODE_VISUALS: Record<ImplicitNodeType, NodeVisual> = {
  vault: {
    icon: KeyIcon,
  },
  request: {
    icon: CloudIcon,
  },
  service_request: {
    icon: CloudIcon,
  },
  service_response: {
    icon: CloudIcon,
  },
  response: {
    icon: CloudIcon,
  },
}

export function getConfigNodeGroupColors(group: ConfigNodeGroup): NodeColors {
  return CONFIG_NODE_GROUP_VISUAL_CATALOG.find(({ id }) => id === group)!.colors
}

export function getNodeVisual(type: NodeType): NodeVisual {
  return CONFIG_NODE_VISUAL_MAP[type as ConfigNodeType] ?? IMPLICIT_NODE_VISUALS[type as ImplicitNodeType]
}
