import { describe, expect, it, vi } from 'vitest'
import { getCelCallables, getCelHint } from '@kong-ui-public/monaco-editor/languages/cel'
import { getPluginFieldCelLanguage } from './cel'

vi.mock('monaco-editor', () => ({}))

const dialect = (path: string) => {
  const language = getPluginFieldCelLanguage(path, () => ({}))
  return {
    pluginState: 'plugins' in language.variables,
    fallback: getCelCallables(undefined, language).some(callable => callable.name === 'default'),
    hints: [getCelHint('plugins.key_auth.is_matched', language)?.kind, getCelHint('default(1, 2)', language)?.kind],
  }
}

describe('getPluginFieldCelLanguage', () => {
  it('rejects plugin state only in ACL rules, and default() only in expressible fields', () => {
    expect(dialect('condition')).toEqual({ pluginState: true, fallback: true, hints: [undefined, undefined] })
    expect(dialect('expressions.custom_key')).toEqual({ pluginState: true, fallback: false, hints: [undefined, 'default'] })
    for (const path of ['config.allow_when.0', 'config.default_acl.1.deny_when.0', 'config.tools.0.acl.allow_when.2']) {
      expect(dialect(path), path).toEqual({ pluginState: false, fallback: true, hints: ['plugin-state', undefined] })
    }
  })
})
