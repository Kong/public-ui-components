import { getLanguageService as getJSONLanguageService, TextDocument, type JSONDocument } from '@kong/vscode-json-languageservice'
import cloneDeep from 'lodash-es/cloneDeep'
import * as monaco from 'monaco-editor'
import { computed, shallowRef, unref, type MaybeRef } from 'vue'
import type { EditorLanguage, RecordFieldSchema } from '../types'
import { buildRecordSchema } from '../utils'

const jsonLanguageService = getJSONLanguageService({})

export default function usePluginConfigEditor(
  name: MaybeRef<string>,
  kongSchema: MaybeRef<RecordFieldSchema>,
  language: MaybeRef<EditorLanguage>,
) {
  const uri = computed(() => monaco.Uri.parse(`kong:///plugin/${unref(name)}/config.${unref(language)}`))
  const schema = computed(() => cloneDeep(buildRecordSchema(unref(kongSchema), unref(language))))

  const model = computed(() => {
    const existingModel = monaco.editor.getModel(uri.value)
    if (existingModel) {
      existingModel.dispose()
    }
    return monaco.editor.createModel(unref(language) === 'json' ? '{}' : '', unref(language), uri.value)
  })

  const textDocument = computed(() =>
    TextDocument.create(uri.value.toString(), unref(language), 0, unref(language) === 'json' ? '{}' : ''),
  )

  const languageSpecificDocument = shallowRef<JSONDocument>(jsonLanguageService.parseJSONDocument(textDocument.value))

  const onDidChangeModelContent = (e: monaco.editor.IModelContentChangedEvent) => {
    TextDocument.update(
      textDocument.value,
      e.changes.map((change) => {
        return {
          range: {
            start: textDocument.value.positionAt(change.rangeOffset),
            end: textDocument.value.positionAt(change.rangeOffset + change.rangeLength),
          },
          rangeLength: change.rangeLength,
          text: change.text,
        }
      }),
      textDocument.value.version + 1,
    )

    languageSpecificDocument.value = jsonLanguageService.parseJSONDocument(textDocument.value)
  }

  return {
    model,
    schema,
    uri,
    textDocument,
    languageSpecificDocument,
    onDidChangeModelContent,
  }
}
