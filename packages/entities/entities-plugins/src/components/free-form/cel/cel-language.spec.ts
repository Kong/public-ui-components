import { describe, expect, it, vi } from 'vitest'

vi.mock('monaco-editor', () => ({}))

import { getCelCompletionContext, getCelHover, getCelSignature, getCelSuggestions } from './cel-language'

const full = { pluginState: true, expressible: false }
const acl = { pluginState: false, expressible: false }
const labels = (before: string, scope = full) => getCelSuggestions(before, scope).map(s => s.label)
const detail = (before: string, label: string) => getCelSuggestions(before, full).find(s => s.label === label)?.detail

describe('getCelCompletionContext', () => {
  it('splits the receiver from the typed identifier', () => {
    expect(getCelCompletionContext('consumer.user', 14)).toEqual({ receiver: 'consumer', prefix: 'user', startColumn: 10 })
    expect(getCelCompletionContext('plugins.key_auth.', 18)).toEqual({ receiver: 'plugins.key_auth', prefix: '', startColumn: 18 })
    expect(getCelCompletionContext('con', 4)).toEqual({ receiver: '', prefix: 'con', startColumn: 1 })
  })

  it('suggests nothing inside a string or comment', () => {
    expect(getCelCompletionContext('route.name == "con', 19)).toBeUndefined()
    expect(getCelCompletionContext('true // con', 12)).toBeUndefined()
  })
})

describe('getCelSuggestions', () => {
  it('offers globals and functions at the start of a term', () => {
    expect(labels('')).toEqual(['http', 'net', 'consumer', 'consumer_group', 'route', 'service', 'principal', 'kong', 'plugins', 'has', 'matches', 'size', 'default'])
    expect(labels('', { pluginState: true, expressible: true })).not.toContain('default')
    expect(labels('', acl)).not.toContain('plugins')
  })

  it('offers fields and methods by the receiver type', () => {
    expect(labels('consumer.')).toEqual(['id', 'custom_id', 'username', 'tags'])
    expect(detail('consumer.', 'username')).toBe('consumer.username · string | null')
    expect(getCelSuggestions('http.', full).find(s => s.label === 'path')?.documentation).toBe('The normalized request path, without the query string.')
    // A macro variable is not a Gateway variable, so it has no description.
    expect(getCelSuggestions('principal.groups.exists(g, g.', full).find(s => s.label === 'id')?.documentation).toBeUndefined()
    expect(labels('consumer.username.')).toEqual(['contains', 'startsWith', 'endsWith', 'matches', 'size'])
    expect(labels('plugins.key_auth.')).toEqual(['is_matched', 'priority', 'access_has_executed'])
    expect(labels('net.src.port.')).toEqual([])
    expect(labels('consumer.name.')).toEqual([])
  })

  it('types a map macro variable as the key, hiding the global of the same name', () => {
    expect(labels('http.headers.map(service, service.')).toEqual(['contains', 'startsWith', 'endsWith', 'matches', 'size'])
    expect(labels('http.headers.map(service, ')).toContain('service')
    expect(detail('http.headers.map(service, ', 'service')).toBe('service · string')
  })

  it('types a list macro variable as the item', () => {
    expect(labels('principal.groups.exists(g, g.')).toEqual(['id', 'type'])
    expect(labels('principal.groups.exists(g, g.id.')).toContain('startsWith')
  })

  it('offers principal.metadata keys from the loaded principals', () => {
    const subjects = { principals: [{ id: 'p-1', metadata: { team: 'ai' } }] }
    expect(getCelSuggestions('principal.metadata.', full, subjects).find(s => s.label === 'team')?.detail).toBe('principal.metadata.team · string')
    expect(getCelSuggestions('principal.metadata.', full).map(s => s.label)).not.toContain('team')
  })

  it('offers nothing while naming a macro variable', () => {
    expect(labels('http.headers.map(')).toEqual([])
    expect(labels('http.headers.map(se')).toEqual([])
  })

  it('offers only paths to a map inside has()', () => {
    expect(labels('has(')).toEqual(['http', 'principal', 'kong', 'plugins'])
    expect(labels('has(http.')).toEqual(['headers', 'headers_list', 'queries', 'queries_list'])
    expect(labels('principal.groups.exists(g, has(')).toContain('g')
  })
})

describe('getCelHover', () => {
  /** Hover at `|`. */
  const hover = (marked: string) => {
    const offset = marked.indexOf('|')
    return getCelHover(marked.slice(0, offset) + marked.slice(offset + 1), offset, full)
  }

  it('shows the type and description of a Gateway variable', () => {
    expect(hover('consumer.i|d == "a"')).toEqual({
      start: 9, end: 11,
      title: 'consumer.id: string | null',
      description: expect.stringContaining('The ID of the authenticated Consumer.'),
    })
    expect(hover('con|sumer.id')).toMatchObject({ start: 0, end: 8, title: 'consumer' })
    expect(hover('http.headers.x_ten|ant')).toMatchObject({ title: 'http.headers.x_tenant: string | null', description: 'The first value of the header, or null when it is absent.' })
  })

  it('shows the type of a macro variable, where it is used and where it is declared', () => {
    expect(hover('http.headers.exists(service, servi|ce == "a")')).toEqual({ start: 29, end: 36, title: 'service: string', description: undefined })
    expect(hover('principal.groups.exists(|g, g.id == "a")')).toMatchObject({ title: 'g: { id, type }' })
    expect(hover('principal.groups.exists(g, g.i|d == "a")')).toMatchObject({ title: 'g.id: string' })
  })

  it('shows the signature and description of a function', () => {
    expect(hover('http.path.starts|With("/v1")')).toMatchObject({ title: 'startsWith(prefix)', description: 'Whether the string starts with the prefix.' })
    expect(hover('ha|s(kong.ctx.shared.x)')).toMatchObject({ title: 'has(field)' })
  })

  it('shows nothing for literals, keywords or unknown names', () => {
    expect(hover('consumer.id == "a|b"')).toBeUndefined()
    expect(hover('tr|ue')).toBeUndefined()
    expect(hover('consumer.na|me')).toBeUndefined()
  })
})

describe('getCelSignature', () => {
  it('finds the callable and the argument', () => {
    expect(getCelSignature('has(', full)).toMatchObject({ callable: { name: 'has' }, argument: 0 })
    expect(getCelSignature('principal.groups.exists(g, ', full)).toMatchObject({ callable: { name: 'exists', parameters: ['item', 'predicate'] }, argument: 1 })
    expect(getCelSignature('http.headers.all(k, ', full)).toMatchObject({ callable: { parameters: ['key', 'predicate'] } })
    expect(getCelSignature('net.src.port.exists(', full)).toBeUndefined()
  })
})
