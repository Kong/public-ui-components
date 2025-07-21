import type { NodeMeta, NodeType } from '../../types'
import { NetworkIcon, CodeblockIcon, GatewayIcon, StackIcon, VitalsIcon } from '@kong/icons'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../../../../../locales/en.json'

const { t } = createI18n<typeof english>('en-us', english)

function getNodeDescription(type: NodeType): string {
  return t(`plugins.free-form.datakit.visual_editor.node_description.${type}`)
}

export const NODE_META_MAP = {
  call: {
    type: 'call',
    description: getNodeDescription('call'),
    icon: NetworkIcon,
  },
  jq: {
    type: 'jq',
    description: getNodeDescription('jq'),
    icon: CodeblockIcon,
  },
  exit: {
    type: 'exit',
    description: getNodeDescription('exit'),
    icon: GatewayIcon,
  },
  property: {
    type: 'property',
    description: getNodeDescription('property'),
    icon: StackIcon,
  },
  static: {
    type: 'static',
    description: getNodeDescription('static'),
    icon: VitalsIcon,
  },
} as const satisfies Record<NodeType, NodeMeta>
