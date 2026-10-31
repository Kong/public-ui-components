import { describe, expect, it } from 'vitest'
import { curlExtractor, deckExtractor, kicExtractor } from './config-extractors'

const config = { nodes: [{ name: 'JQ', type: 'jq', jq: '.' }] }

describe('Datakit config extractors (pasting into the code editor)', () => {
  describe('decK', () => {
    it('extracts the datakit plugin', () => {
      const content = `
_format_version: "3.0"
plugins:
- name: cors
- name: datakit
  config:
    nodes:
    - name: JQ
      type: jq
      jq: "."
`
      expect(deckExtractor.extract(content)).toEqual({ name: 'datakit', config })
    })

    it.each([
      ['no datakit plugin', 'plugins:\n- name: cors\n'],
      ['no plugins', 'services: []\n'],
      ['invalid YAML', 'plugins: [\n'],
    ])('ignores %s', (_, content) => {
      expect(deckExtractor.extract(content)).toBeNull()
    })
  })

  describe('KIC', () => {
    const resource = `apiVersion: configuration.konghq.com/v1
kind: KongPlugin
metadata:
  name: datakit
plugin: datakit
config:
  nodes:
  - name: JQ
    type: jq
    jq: "."
`

    it('extracts a KongPlugin resource', () => {
      expect(kicExtractor.extract(resource)).toMatchObject({ kind: 'KongPlugin', plugin: 'datakit', config })
    })

    it('extracts a KongClusterPlugin resource', () => {
      expect(kicExtractor.extract(resource.replace('KongPlugin', 'KongClusterPlugin'))).toMatchObject({ kind: 'KongClusterPlugin' })
    })

    it('extracts a resource piped to kubectl', () => {
      expect(kicExtractor.extract(`echo "${resource}" | kubectl apply -f -`)).toMatchObject({ plugin: 'datakit', config })
    })

    it.each([
      ['another plugin', resource.replace('plugin: datakit', 'plugin: cors').replace('name: datakit', 'name: cors')],
      ['another kind', resource.replace('KongPlugin', 'ConfigMap')],
      ['invalid YAML', 'kind: [\n'],
    ])('ignores %s', (_, content) => {
      expect(kicExtractor.extract(content)).toBeNull()
    })
  })

  describe('cURL', () => {
    const body = JSON.stringify({ name: 'datakit', config })

    it('extracts a single-quoted --data body', () => {
      expect(curlExtractor.extract(`curl -X POST http://localhost:8001/plugins --data '${body}'`)).toEqual({ name: 'datakit', config })
    })

    it.each(['--data-raw', '--data-binary'])('extracts a %s body (Copy as cURL)', (flag) => {
      expect(curlExtractor.extract(`curl -X POST http://localhost:8001/plugins ${flag} '${body}'`)).toEqual({ name: 'datakit', config })
    })

    it('extracts a double-quoted -d body with escaped quotes', () => {
      const escaped = body.replace(/"/g, '\\"')
      expect(curlExtractor.extract(`curl -X POST http://localhost:8001/plugins -d "${escaped}"`)).toEqual({ name: 'datakit', config })
    })

    it.each([
      ['another plugin', 'curl http://localhost:8001/plugins --data \'{"name":"cors"}\''],
      ['no body', 'curl http://localhost:8001/plugins'],
      ['invalid JSON', 'curl http://localhost:8001/plugins --data \'{oops}\''],
      ['not a curl command', `wget --data '${body}'`],
    ])('ignores %s', (_, content) => {
      expect(curlExtractor.extract(content)).toBeNull()
    })
  })
})
