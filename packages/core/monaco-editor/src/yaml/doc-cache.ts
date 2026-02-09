import { LineCounter, parseDocument } from 'yaml'
import type { Document } from 'yaml'
import type * as monaco from 'monaco-editor'

export type CachedYamlDoc = {
  versionId: number
  yamlVersion: '1.1'
  doc: Document.Parsed
  lineCounter: LineCounter
  data: unknown
}

const cache = new WeakMap<monaco.editor.ITextModel, CachedYamlDoc>()

export function getYamlDoc(
  model: monaco.editor.ITextModel,
  yamlVersion: '1.1',
): CachedYamlDoc {
  const versionId = model.getAlternativeVersionId()
  const cached = cache.get(model)
  if (cached && cached.versionId === versionId && cached.yamlVersion === yamlVersion) {
    return cached
  }

  const lineCounter = new LineCounter()
  const doc = parseDocument(model.getValue(), {
    lineCounter,
    schema: 'yaml-1.1',
  })
  const data = doc.toJS()

  const next: CachedYamlDoc = {
    versionId,
    yamlVersion,
    doc,
    lineCounter,
    data,
  }
  cache.set(model, next)
  return next
}
