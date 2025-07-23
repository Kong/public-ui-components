import type { NodeMeta, NodeType } from '../../types'
import { NetworkIcon, CodeblockIcon, GatewayIcon, StackIcon, VitalsIcon } from '@kong/icons'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../locales/en.json'

const { t } = createI18n<typeof english>('en-us', english)

function getNodeDescription(type: NodeType): string {
  return t(`plugins.free-form.datakit.flow_editor.node.${type}.description`)
}

function getNodeLabel(type: NodeType): string {
  return t(`plugins.free-form.datakit.flow_editor.node.${type}.label`)
}

export const NODE_META_MAP = {
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
  request: {
    type: 'request',
    description: getNodeDescription('request'),
    label: getNodeLabel('request'),
  },
  response: {
    type: 'response',
    description: getNodeDescription('response'),
    label: getNodeLabel('response'),
  },
  'service-request': {
    type: 'service-request',
    description: getNodeDescription('service-request'),
    label: getNodeLabel('service-request'),
  },
  'service-response': {
    type: 'service-response',
    description: getNodeDescription('service-response'),
    label: getNodeLabel('service-response'),
  },
} as const satisfies Record<NodeType, NodeMeta>
