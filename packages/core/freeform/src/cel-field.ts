import { inject } from 'vue'
import { CEL_EDITOR_KEY } from './constants'
import { EXPRESSIONS_FIELD } from './composables/expression-paths'

/**
 * The kind of CEL expression the plugin field at `path` holds, if any:
 * - `condition`: the plugin `condition`
 * - `expression`: the expression twin of an expressible field (`expressions.*`)
 * - `acl-rule`: an ACL rule, an item of `allow_when`/`deny_when` (the acl plugin, and the ai-mcp-proxy ACLs)
 */
export const getCelFieldKind = (path: string): 'condition' | 'expression' | 'acl-rule' | undefined => {
  if (path === 'condition') return 'condition'
  if (path.startsWith(`${EXPRESSIONS_FIELD}.`)) return 'expression'
  if (/(?:^|\.)(?:allow|deny)_when\.\d+$/.test(path)) return 'acl-rule'
}

/**
 * Whether the field at a path renders the CEL editor instead of its plain input:
 * the host's `CEL_EDITOR_KEY` decision. Without one, no field does.
 */
export const useCelEditor = () => inject(CEL_EDITOR_KEY, () => false)
