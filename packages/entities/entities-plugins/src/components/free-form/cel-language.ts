import {
  defineCelLanguage, kongAclRule, kongConsumer, kongConsumerGroup, kongContext, kongExpressibleField, kongFallback, kongHttp, kongNet,
  kongPluginState, kongPrincipal, kongRoute, kongService,
} from '@kong-ui-public/monaco-editor/languages/cel'
import type { CelLanguage, CelSubjects } from '@kong-ui-public/monaco-editor/languages/cel'
import type { PluginCelFieldKind } from './cel-editor'

/**
 * The CEL dialect of the plugin field of this kind: every Kong Gateway variable,
 * except plugin state in ACL rules and `default()` in expressible fields.
 * `records` reads the records that value suggestions name.
 */
export const getPluginFieldCelLanguage = (kind: PluginCelFieldKind, records: () => CelSubjects): CelLanguage => {
  return defineCelLanguage([
    kongHttp(), kongNet(), kongConsumer(records), kongConsumerGroup(records), kongRoute(), kongService(), kongPrincipal(records), kongContext(),
    kind === 'acl-rule' ? kongAclRule() : kongPluginState(),
    kind === 'expression' ? kongExpressibleField() : kongFallback(),
  ])
}
