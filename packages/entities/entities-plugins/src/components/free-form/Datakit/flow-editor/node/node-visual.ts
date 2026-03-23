import {
  CloudIcon,
  KeyIcon,
} from '@kong/icons'
import type {
  ImplicitNodeType,
  NodeVisual,
} from '../../types'

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
