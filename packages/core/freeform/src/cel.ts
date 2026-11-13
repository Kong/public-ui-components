import {
  defineCelLanguage, kongAclRule, kongConsumer, kongConsumerGroup, kongContext, kongExpressibleField, kongFallback, kongHttp, kongNet,
  kongPluginState, kongPrincipal, kongRoute, kongService,
} from '@kong-ui-public/monaco-editor/languages/cel'
import type { CelLanguage, CelSubjects } from '@kong-ui-public/monaco-editor/languages/cel'

// ACL rules: the acl plugin, and the ai-mcp-proxy ACLs (`default_acl[]`, `tools[].acl`).
const ACL_RULE = /(?:^|\.)(?:allow|deny)_when(?:\.|$)/
const EXPRESSIBLE_FIELD = /^expressions(?:\.|$)/

/**
 * The CEL dialect of the plugin field at `path`: every Kong Gateway variable,
 * except plugin state in ACL rules and `default()` in expressible fields.
 * `records` reads the records that value suggestions name.
 */
export const getPluginFieldCelLanguage = (path: string, records: () => CelSubjects): CelLanguage => defineCelLanguage([
  kongHttp(), kongNet(), kongConsumer(records), kongConsumerGroup(records), kongRoute(), kongService(), kongPrincipal(records), kongContext(),
  ACL_RULE.test(path) ? kongAclRule() : kongPluginState(),
  EXPRESSIBLE_FIELD.test(path) ? kongExpressibleField() : kongFallback(),
])
