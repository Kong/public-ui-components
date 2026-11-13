import { describe, expect, it } from 'vitest'
import { defineCelLanguage } from './catalog'
import { kongConsumer, kongConsumerGroup, kongContext, kongFallback, kongHttp, kongNet, kongPluginState, kongPrincipal, kongRoute, kongService } from './kong'
import type { CelSubjects } from './kong'
import {
  getCelComparedSubject, getCelHoveredSubject, getCelKeys, getCelSubjectSuggestions, getCelSubjectValues,
} from './subjects'

const subjects: CelSubjects = {
  consumers: [
    { id: 'c-1', username: 'alice', custom_id: 'A-1' },
    { id: 'c-2', username: null, custom_id: 'B-2' },
  ],
  consumerGroups: [{ id: 'cg-1', name: 'gold' }, { id: 'cg-2', name: 'silver' }],
  principals: [
    { id: 'p-1', display_name: 'Ada', metadata: { team: 'ai', level: 3, 'bad-key': 1 } },
    { id: 'p-2', metadata: { team: 'core', tags: ['x'] } },
  ],
  principalGroups: [{ id: 'pg-1', name: 'Admins' }],
}
const records = () => subjects
const full = defineCelLanguage([
  kongHttp(), kongNet(), kongConsumer(records), kongConsumerGroup(records), kongRoute(), kongService(), kongPrincipal(records), kongContext(),
  kongPluginState(), kongFallback(),
])

/** The compared subject of the first `""` in the source. */
const comparedAt = (source: string) => {
  const start = source.indexOf('""')
  return getCelComparedSubject(source, start, start + 2, full)
}

/** Suggestions with the cursor at `|`. */
const suggest = (marked: string) => {
  const offset = marked.indexOf('|')
  return getCelSubjectSuggestions(marked.slice(0, offset) + marked.slice(offset + 1), offset, full)
}

describe('getCelSubjectValues', () => {
  it('lists the values each subject kind takes', () => {
    expect(getCelSubjectValues(full, 'consumer-id').map(v => [v.value, v.name])).toEqual([['c-1', 'alice'], ['c-2', 'B-2']])
    expect(getCelSubjectValues(full, 'consumer-username').map(v => v.value)).toEqual(['alice'])
    expect(getCelSubjectValues(full, 'consumer-custom-id').map(v => v.value)).toEqual(['A-1', 'B-2'])
    expect(getCelSubjectValues(full, 'consumer-group-name').map(v => v.value)).toEqual(['gold', 'silver'])
    expect(getCelSubjectValues(full, 'consumer-group-id').map(v => [v.value, v.name])).toEqual([['cg-1', 'gold'], ['cg-2', 'silver']])
    expect(getCelSubjectValues(full, 'principal-id').map(v => [v.value, v.name])).toEqual([['p-1', 'Ada'], ['p-2', 'p-2']])
    expect(getCelSubjectValues(full, 'principal-group-id').map(v => v.name)).toEqual(['Admins'])
    expect(getCelSubjectValues(defineCelLanguage([kongPrincipal()]), 'principal-id')).toEqual([])
  })
})

describe('getCelComparedSubject', () => {
  it('finds the variable on either side of a comparison', () => {
    expect(comparedAt('consumer.username == ""')).toBe('consumer-username')
    expect(comparedAt('consumer.id != ""')).toBe('consumer-id')
    expect(comparedAt('"" == principal.id')).toBe('principal-id')
  })

  it('finds the list after in', () => {
    expect(comparedAt('"" in consumer_group.names')).toBe('consumer-group-name')
    expect(comparedAt('"" in consumer_group.ids && true')).toBe('consumer-group-id')
  })

  it('follows macro variables', () => {
    expect(comparedAt('principal.groups.exists(g, g.id == "")')).toBe('principal-group-id')
    expect(comparedAt('consumer_group.names.exists(n, n == "")')).toBe('consumer-group-name')
  })

  it('ignores variables that name no record, and method calls', () => {
    expect(comparedAt('route.name == ""')).toBeUndefined()
    expect(comparedAt('"" == consumer.username.size()')).toBeUndefined()
    expect(comparedAt('"" in consumer.tags')).toBeUndefined()
  })
})

describe('getCelSubjectSuggestions', () => {
  it('replaces the whole literal, matching the name or the value', () => {
    const { suggestions, inLiteral } = suggest('consumer.id == "al|"')
    expect(inLiteral).toBe(true)
    expect(suggestions).toEqual([{ label: 'alice', detail: 'c-1', insertText: '"c-1"', filterText: '"alice', start: 15, end: 19 }])
    expect(suggest('consumer.id == "c-|"').suggestions.map(s => s.insertText)).toEqual(['"c-1"', '"c-2"'])
    // Any part of the name matches, as in a prefixed username.
    expect(suggest('consumer.id == "lic|"').suggestions.map(s => s.label)).toEqual(['alice'])
  })

  it('keeps the quote style and works in an unclosed literal', () => {
    expect(suggest('"g|" in consumer_group.names').suggestions.map(s => s.insertText)).toEqual(['"gold"'])
    expect(suggest("principal.id == 'A|").suggestions.map(s => s.insertText)).toEqual(["'p-1'"])
  })

  it('offers quoted values before the literal starts', () => {
    const { suggestions, inLiteral } = suggest('consumer.username == |')
    expect(inLiteral).toBe(false)
    expect(suggestions.map(s => s.insertText)).toEqual(['"alice"'])
  })

  it('corrects a single = to == when a value is chosen', () => {
    const unquoted = suggest('consumer.id = |')
    expect(unquoted.suggestions.map(s => [s.insertText, s.filterText, s.start, s.end])).toEqual([
      ['== "c-1"', '= alice', 12, 14],
      ['== "c-2"', '= B-2', 12, 14],
    ])
    expect(suggest('consumer.id = "al|"').suggestions).toEqual([
      { label: 'alice', detail: 'c-1', insertText: '== "c-1"', filterText: '= "alice', start: 12, end: 18 },
    ])
    expect(getCelComparedSubject('consumer.username = ""', 19, 21, full)).toBe('consumer-username')
  })

  it('offers nothing in other literals', () => {
    expect(suggest('route.name == "|"')).toEqual({ suggestions: [], inLiteral: true })
    expect(suggest('http.path == |').suggestions).toEqual([])
  })
})

describe('getCelHoveredSubject', () => {
  it('names the record a literal refers to', () => {
    const source = 'principal.groups.exists(g, g.id == "pg-1")'
    expect(getCelHoveredSubject(source, source.indexOf('pg-1'), full))
      .toEqual({ subject: { kind: 'principal-group-id', value: 'pg-1', name: 'Admins', id: 'pg-1' }, start: 35, end: 41 })
    expect(getCelHoveredSubject("consumer.custom_id == 'B-2'", 24, full)?.subject.name).toBe('B-2')
    expect(getCelHoveredSubject('consumer.id == "unknown"', 18, full)).toBeUndefined()
  })
})

describe('getCelKeys', () => {
  it('lists selectable keys with the value types seen', () => {
    expect(getCelKeys(full, 'principal.metadata')).toEqual([
      { key: 'level', types: ['number'] },
      { key: 'tags', types: ['list'] },
      { key: 'team', types: ['string'] },
    ])
  })
})
