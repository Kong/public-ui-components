import {
  KUI_COLOR_BACKGROUND_DECORATIVE_AQUA_WEAKEST,
  KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE_WEAKEST,
  KUI_COLOR_BACKGROUND_WARNING_WEAKEST,
  KUI_COLOR_TEXT_DANGER,
  KUI_COLOR_TEXT_DANGER_WEAKEST,
  KUI_COLOR_TEXT_DECORATIVE_AQUA,
  KUI_COLOR_TEXT_DECORATIVE_PINK,
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
  GatewayIcon,
  KeyIcon,
  NetworkIcon,
  StackIcon,
  VitalsIcon,
  CachedIcon,
} from '@kong/icons'
import type { NodeType, NodeVisual } from '../../types'

export const NODE_VISUAL: Record<NodeType, NodeVisual> = {
  call: {
    icon: NetworkIcon,
    colors: {
      foreground: KUI_COLOR_TEXT_WARNING,
      background: KUI_COLOR_BACKGROUND_WARNING_WEAKEST,
    },
  },
  jq: {
    icon: CodeblockIcon,
    colors: {
      foreground: KUI_COLOR_TEXT_DECORATIVE_PURPLE,
      background: KUI_COLOR_BACKGROUND_DECORATIVE_PURPLE_WEAKEST,
    },
  },
  exit: {
    icon: GatewayIcon,
    colors: {
      foreground: KUI_COLOR_TEXT_DANGER,
      background: KUI_COLOR_TEXT_DANGER_WEAKEST,
    },
  },
  property: {
    icon: StackIcon,
    colors: {
      foreground: KUI_COLOR_TEXT_SUCCESS,
      background: KUI_COLOR_TEXT_SUCCESS_WEAKEST,
    },
  },
  static: {
    icon: VitalsIcon,
    colors: {
      foreground: KUI_COLOR_TEXT_PRIMARY,
      background: KUI_COLOR_TEXT_PRIMARY_WEAKEST,
    },
  },
  branch: {
    icon: ArrowSplitIcon,
    colors: {
      foreground: KUI_COLOR_TEXT_DECORATIVE_AQUA,
      background: KUI_COLOR_BACKGROUND_DECORATIVE_AQUA_WEAKEST,
    },
  },
  cache: {
    icon: CachedIcon,
    colors: {
      foreground: KUI_COLOR_TEXT_DECORATIVE_PINK,
      background: '#fff0f7', // Pink-tinted background for cache node
    },
  },
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
