import { cloneDeep } from 'lodash-es'
import type * as Monaco from 'monaco-editor'
import { v4 as uuid } from 'uuid'
import {
  getLanguageService as getJSONLanguageService,
  TextDocument,
  type JSONDocument,
} from 'vscode-json-languageservice'
import { computed, shallowRef, unref, type MaybeRef } from 'vue'
import { type EditorLanguage, type LuaSchema } from '../types'
import { buildRecordSchema } from '../utils'

declare global {
  interface Window {
    require: any
  }
}

const jsonLanguageService = getJSONLanguageService({})

export default function useMonacoEditor(
  monaco: typeof Monaco,
  language: MaybeRef<EditorLanguage>,
  documentId: MaybeRef<string | undefined>,
  luaSchema: MaybeRef<LuaSchema | undefined>,
) {
  const uri = computed(() => {
    const documentName = unref(documentId) || `unsaved_${uuid()}`
    return monaco.Uri.parse(`kong:///editor/entities/${documentName}.${unref(language)}`)
  })

  const schema = computed(() => {
    const _luaSchema = unref(luaSchema)
    if (!_luaSchema) {
      return undefined
    }

    const rootSchema = cloneDeep(buildRecordSchema(_luaSchema, unref(language)))
    rootSchema.properties = {
      ...rootSchema.properties,
    }
    return rootSchema
  })

  const model = computed(() => {
    const _language = unref(language)
    const existingModel = monaco.editor.getModel(uri.value)
    if (existingModel) {
      existingModel.dispose()
    }
    return monaco.editor.createModel(_language === 'json' ? '{}' : '', _language, uri.value)
  })

  const textDocument = computed(() =>{
    const _language = unref(language)
    return TextDocument.create(uri.value.toString(), _language, 0, _language === 'json' ? '{}' : '')
  })

  const languageSpecificDocument = shallowRef<JSONDocument>(jsonLanguageService.parseJSONDocument(textDocument.value))

  const onDidChangeModelContent = (e: Monaco.editor.IModelContentChangedEvent) => {
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
