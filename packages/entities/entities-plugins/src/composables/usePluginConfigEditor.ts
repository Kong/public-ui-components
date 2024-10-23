import {
  getLanguageService as getJSONLanguageService,
  TextDocument,
  type JSONDocument,
  type JSONSchema,
} from '@kong/vscode-json-languageservice'
import cloneDeep from 'lodash-es/cloneDeep'
import type * as Monaco from 'monaco-editor'
import type { StaticPluginMetaData } from 'src/definitions/metadata'
import { computed, shallowRef, unref, type MaybeRef } from 'vue'
import { PluginScope, type EditorLanguage, type RecordFieldSchema } from '../types'
import { buildRecordSchema } from '../utils'

declare global {
  interface Window {
    require: any
  }
}

const jsonLanguageService = getJSONLanguageService({})

export default function usePluginConfigEditor(
  monaco: typeof Monaco,
  name: MaybeRef<string>,
  metadata: MaybeRef<StaticPluginMetaData>,
  rawGatewaySchema: MaybeRef<RecordFieldSchema>,
  language: MaybeRef<EditorLanguage>,
) {
  const uri = computed(() => monaco.Uri.parse(`kong:///plugin/${unref(name)}/config.${unref(language)}`))
  const schema = computed(() => {
    const rootSchema = cloneDeep(buildRecordSchema(unref(rawGatewaySchema), unref(language)))

    const scopingFields: Record<string, JSONSchema> = {}

    const scopes = new Set(unref(metadata).scope)

    if (scopes.has(PluginScope.SERVICE)) {
      scopingFields['service'] = {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            description: 'The ID of the Service the plugin targets.',
          },
          name: {
            type: 'string',
            description: 'The name of the Service the plugin targets.',
          },
        },
        oneOf: [
          { required: ['id'] },
          { required: ['name'] },
        ],
        propertyCompletion: {
          openValues:true,
          suggestAfterCompletion: true,
        },
        // defaultSnippets: [
        //   {
        //     label: 'a. Search for a service',
        //     body: '',
        //     markdownDescription: [
        //       '1. Search for a service by typing keywords inside the `""` (e.g. `"my-service"`)',
        //       '2. Wait for the search results',
        //       '3. Pick a service from the list',
        //       '4. ',
        //     ].join('\n'),
        //     filterText: '',
        //   },
        //   {
        //     label: 'b. Provide a service ID',
        //     body: { id: '' },
        //     description: '',
        //     filterText: 'xxx',
        //   },
        //   {
        //     label: 'c. Provide a service name',
        //     body: { name: '' },
        //     description: '',
        //     filterText: '',
        //   },
        // ],
      }
    }

    if (!scopes.has(PluginScope.GLOBAL)) {
      // stub
    }

    rootSchema.properties = {
      ...rootSchema.properties,
      ...scopingFields,
    }

    return rootSchema
  })

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
