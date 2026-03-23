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
  CloudIcon,
  CodeblockIcon,
  EditSquareIcon,
  GatewayIcon,
  KeyIcon,
  NetworkIcon,
  StackIcon,
  DeployIcon,
  CachedIcon,
  CodeIcon,
  DataObjectIcon,
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

export const CONFIG_NODE_GROUP_COLORS: Record<ConfigNodeGroup, NodeColors> = {
  external_interaction: {
    foreground: KUI_COLOR_TEXT_WARNING,
    background: KUI_COLOR_BACKGROUND_WARNING_WEAKEST,
  },
  control_flow: {
    foreground: KUI_COLOR_TEXT_DECORATIVE_AQUA,
    background: KUI_COLOR_BACKGROUND_DECORATIVE_AQUA_WEAKEST,
  },
  data_transformation: {
    foreground: KUI_COLOR_TEXT_DECORATIVE_PURPLE,
    background: KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE_WEAKEST,
  },
  data_value: {
    foreground: KUI_COLOR_TEXT_SUCCESS,
    background: KUI_COLOR_TEXT_SUCCESS_WEAKEST,
  },
  authentication: {
    foreground: KUI_COLOR_TEXT_PRIMARY,
    background: KUI_COLOR_TEXT_PRIMARY_WEAKEST,
  },
}

export const CONFIG_NODE_ICON_MAP: Record<ConfigNodeType, NodeVisual['icon']> = {
  call: NetworkIcon,
  jq: CodeblockIcon,
  exit: GatewayIcon,
  property: StackIcon,
  static: DeployIcon,
  branch: ArrowSplitIcon,
  cache: CachedIcon,
  xml_to_json: DataObjectIcon,
  json_to_xml: CodeIcon,
  jwt_decode: JwtDecodeIcon,
  jwt_sign: EditSquareIcon,
  jwt_verify: JwtVerifyIcon,
}

const IMPLICIT_NODE_VISUALS: Record<ImplicitNodeType, NodeVisual> = {
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

export const NODE_VISUAL: Record<NodeType, NodeVisual> = {
  ...Object.fromEntries(
    Object.entries(CONFIG_NODE_ICON_MAP).map(([type, icon]) => [type, { icon }]),
  ) as Record<ConfigNodeType, NodeVisual>,
  ...IMPLICIT_NODE_VISUALS,
}
