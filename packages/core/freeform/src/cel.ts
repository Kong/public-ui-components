import {
  defineCelLanguage, kongAclRule, kongConsumer, kongConsumerGroup, kongContext, kongExpressibleField, kongFallback, kongHttp, kongNet,
  kongPluginState, kongPrincipal, kongRoute, kongService,
} from '@kong-ui-public/monaco-editor/languages/cel'
import type { CelLanguage, CelSubjects } from '@kong-ui-public/monaco-editor/languages/cel'
import { getCelFieldKind } from './cel-field'

/**
 * The CEL dialect of the plugin field at `path`: every Kong Gateway variable,
 * except plugin state in ACL rules and `default()` in expressible fields.
 * `records` reads the records that value suggestions name.
 */
export const getPluginFieldCelLanguage = (path: string, records: () => CelSubjects): CelLanguage => {
  const kind = getCelFieldKind(path)
  return defineCelLanguage([
    kongHttp(), kongNet(), kongConsumer(records), kongConsumerGroup(records), kongRoute(), kongService(), kongPrincipal(records), kongContext(),
    kind === 'acl-rule' ? kongAclRule() : kongPluginState(),
    kind === 'expression' ? kongExpressibleField() : kongFallback(),
  ])
}
