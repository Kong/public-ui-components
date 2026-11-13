import { describe, expect, it, vi } from 'vitest'
import { getCelCallables, getCelHint } from '@kong-ui-public/monaco-editor/languages/cel'
import { getPluginFieldCelLanguage } from './cel-language'
import type { PluginCelFieldKind } from './cel-editor'

vi.mock('monaco-editor', () => ({}))

const dialect = (kind: PluginCelFieldKind) => {
  const language = getPluginFieldCelLanguage(kind, () => ({}))
  return {
    pluginState: 'plugins' in language.variables,
    fallback: getCelCallables(undefined, language).some(callable => callable.name === 'default'),
    hints: [getCelHint('plugins.key_auth.is_matched', language)?.kind, getCelHint('default(1, 2)', language)?.kind],
  }
}

describe('getPluginFieldCelLanguage', () => {
  it('rejects plugin state only in ACL rules, and default() only in expressible fields', () => {
    expect(dialect('condition')).toEqual({ pluginState: true, fallback: true, hints: [undefined, undefined] })
    expect(dialect('expression')).toEqual({ pluginState: true, fallback: false, hints: [undefined, 'default'] })
    expect(dialect('acl-rule')).toEqual({ pluginState: false, fallback: true, hints: ['plugin-state', undefined] })
  })
})
