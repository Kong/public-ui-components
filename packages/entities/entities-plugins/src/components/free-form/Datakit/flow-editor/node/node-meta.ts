import { createI18n } from '@kong-ui-public/i18n'
import { CodeblockIcon, GatewayIcon, NetworkIcon, StackIcon, VitalsIcon } from '@kong/icons'
import english from '../../../../../locales/en.json'
import type { ImplicitNodeMeta, ImplicitNodeType, NodeMeta, UserNodeMeta, UserNodeType } from '../../types'

const { t } = createI18n<typeof english>('en-us', english)

function getNodeLabel(type: UserNodeType): string {
  return t(`plugins.free-form.datakit.flow_editor.node.${type}.label`)
}

function getNodeDescription(type: UserNodeType): string {
  return t(`plugins.free-form.datakit.flow_editor.node.${type}.description`)
}

export const USER_NODE_META_MAP = {
  call: {
    type: 'call',
    description: getNodeDescription('call'),
    icon: NetworkIcon,
    label: getNodeLabel('call'),
  },
  jq: {
    type: 'jq',
    description: getNodeDescription('jq'),
    icon: CodeblockIcon,
    label: getNodeLabel('jq'),
  },
  exit: {
    type: 'exit',
    description: getNodeDescription('exit'),
    icon: GatewayIcon,
    label: getNodeLabel('exit'),
  },
  property: {
    type: 'property',
    description: getNodeDescription('property'),
    icon: StackIcon,
    label: getNodeLabel('property'),
  },
  static: {
    type: 'static',
    description: getNodeDescription('static'),
    icon: VitalsIcon,
    label: getNodeLabel('static'),
  },
} as const satisfies Record<UserNodeType, UserNodeMeta>

export const IMPLICIT_NODE_META_MAP = {
  request: {
    type: 'request',
    handles: {
      output: [
        { id: 'headers', label: 'headers' },
        { id: 'body', label: 'body' },
        { id: 'query', label: 'query' },
      ],
    },
  },
  service_request: {
    type: 'service_request',
    handles: {
      input: [
        { id: 'headers', label: 'headers' },
        { id: 'body', label: 'body' },
        { id: 'query', label: 'query' },
      ],
    },
  },
  service_response: {
    type: 'service_response',
    handles: {
      output: [
        { id: 'headers', label: 'headers' },
        { id: 'body', label: 'body' },
      ],
    },
    ioDirection: 'rl',
  },
  response: {
    type: 'response',
    handles: {
      input: [
        { id: 'headers', label: 'headers' },
        { id: 'body', label: 'body' },
      ],
    },
    ioDirection: 'rl',
  },
} as const satisfies Record<ImplicitNodeType, ImplicitNodeMeta>

const IMPLICIT_NODE_TYPES = [
  'request',
  'response',
  'service_request',
  'service_response',
] as const satisfies ImplicitNodeType[]

export const isImplicit = (meta: NodeMeta): meta is ImplicitNodeMeta =>
  IMPLICIT_NODE_TYPES.includes(meta.type as ImplicitNodeType)

