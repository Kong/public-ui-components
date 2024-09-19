<template>
  <div class="plugin-config-editor">
    <div class="plugin-config-editor-toolbar">
      <KSegmentedControl
        v-model="language"
        class="language-control"
        :options="languageOptions"
      />
    </div>

    <div class="plugin-config-editor-wrapper">
      <div
        ref="editorRef"
        class="plugin-config-editor-editor"
      />

      <div class="plugin-config-editor-panel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { FORMS_API_KEY } from '@kong-ui-public/forms'
import * as monaco from 'monaco-editor'
import { inject, onBeforeUnmount, onMounted, ref, toRefs, watch } from 'vue'
import composables from '../composables'
import { type EditorLanguage, type FormsApi, type RecordFieldSchema } from '../types'
import { isValidUuid } from '../utils'

const languageOptions = [
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
]

const props = defineProps<{
  name: string;
  kongSchema: RecordFieldSchema;
}>()

let editorDisposables: monaco.IDisposable[] = []
let editor: monaco.editor.IStandaloneCodeEditor
let editorDecorations: string[] = []

const editorRef = ref<HTMLElement | null>(null)
const { name, kongSchema } = toRefs(props)
const language = ref<EditorLanguage>('json')

const { model, schema, uri, textDocument, languageSpecificDocument, onDidChangeModelContent } = composables.usePluginConfigEditor(name, kongSchema, language)

const updateModel = (model: monaco.editor.ITextModel) => {
  editor.setModel(model)
}

const updateSchemaUri = (schema: any, uri: monaco.Uri) => {
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: [
      {
        uri: uri.toString(),
        fileMatch: [uri.toString()],
        schema,
      },
    ],
  })
}

const makeDetailsVisible = () => {
  // Credits: https://github.com/microsoft/monaco-editor/issues/2241#issuecomment-997339142
  const suggestController = editor.getContribution('editor.contrib.suggestController') as any
  if (suggestController) {
    const suggestWidget = suggestController.widget?.value
    if (suggestWidget && suggestWidget._setDetailsVisible) {
      suggestWidget._setDetailsVisible(true)
    }

    // if (suggestWidget && suggestWidget._persistedSize) {
    //   suggestWidget._persistedSize.store({ width: 200, height: 256 })
    // }
  }
}

watch(model, (newModel) => {
  console.log('model updated', newModel)
  updateModel(newModel)
})

watch([schema, uri], ([newSchema, newUri]) => {
  console.log('schema & uri updated', newSchema, newUri)
  updateSchemaUri(newSchema, newUri)
})

const PREFETCH_COUNT = 1000
const formsApi = inject<FormsApi>(FORMS_API_KEY)

const fetchForeignRecords = async (entity: string, params?: any, onDrained?: () => void) => {
  const data = []
  let offset = null

  if (!formsApi) {
    console.warn('[@kong-ui-public/forms] No API service provided')
    return []
  }
  while (data.length < PREFETCH_COUNT) {
    const res = await formsApi.getAll(entity, {
      size: PREFETCH_COUNT > 1000 ? 1000 : PREFETCH_COUNT,
      offset,
      ...params,
    })

    data.push(...res.data.data)
    offset = res.data.offset
    if (!offset) break
  }

  // Report we have drained the data
  if (data.length <= PREFETCH_COUNT && !offset) {
    console.log(entity, 'drained')
    onDrained?.()
  }

  return data.slice(0, PREFETCH_COUNT)
}

const foreignEntityDrained: Record<string, boolean> = {
  services: false,
}

let prefetchedServices: Promise<any[]> = fetchForeignRecords('services', undefined, () => {
  foreignEntityDrained.services = true
})

const searchForeignRecords = async (entity: string, query: string): Promise<any[]> => {
  if (query.trim().length === 0) {
    return []
  }

  if (foreignEntityDrained[entity]) {
    // use prefetched result
    console.log('using prefetched result')
    return (await prefetchedServices).filter((item) => {
      if (isValidUuid(query) && item.id === query) {
        return true
      }

      if (item.name.includes(query)) {
        return true
      }

      return false
    })
  }

  const items: any[] = []
  const promises = []
  const fields = ['id', 'name'] // get from schema or something
  const filteredIds = new Set()

  // If query is a valid UUID, do the exact search
  // if (isValidUuid(query) && fields.includes('id')) {
  // promises.push((async () => {
  //   const item = await this.fetchExact(query)

  //   items.push({ ...item, label: this.getSuggestionLabel(item), value: item.id })
  // })())
  // } else {
  // Search on fields with backend filtering support
  promises.push(
    ...fields
      .filter((field) => field !== 'id')
      .map(async (field) => {
        const result = await fetchForeignRecords(entity, { [field]: query })
        result.forEach((item) => {
          if (!filteredIds.has(item.id)) {
            filteredIds.add(item.id)
            items.push(item)
          }
        })
      }),
  )
  // }

  await Promise.all(promises)

  return items
}

onBeforeUnmount(() => {
  editorDisposables.forEach((d) => d?.dispose())
})

onMounted(() => {
  editor = monaco.editor.create(editorRef.value as HTMLElement, {
    theme: 'vs',
    automaticLayout: true,
  })

  makeDetailsVisible()

  editorDisposables.push(
    editor.onDidChangeModelContent((e) => {
      makeDetailsVisible()
      onDidChangeModelContent(e)
    }),
  )

  editor.onDidChangeCursorPosition((e) => {
    const offset = textDocument.value.offsetAt({
      line: e.position.lineNumber - 1,
      character: e.position.column - 1,
    })
    const node = languageSpecificDocument.value.getNodeFromOffset(offset)
    if (node?.type === 'string' && node.parent?.type === 'property' && node.parent.keyNode.value === 'service') {
      const suggestController = editor.getContribution('editor.contrib.suggestController') as any
      if (suggestController) {
        // Hack
        suggestController.triggerSuggest()
      }
    }
  })

  editorDisposables.push(
    monaco.editor.onDidChangeMarkers((uris) => {
      const matchingUri = uris.find((u) => u.toString() === uri.value.toString())

      if (matchingUri) {
        const decorations: monaco.editor.IModelDeltaDecoration[] = []
        const markers = monaco.editor.getModelMarkers({
          resource: uri.value,
        })

        for (const marker of markers) {
          const node = languageSpecificDocument.value.getNodeFromOffset(
            textDocument.value.offsetAt({ line: marker.startLineNumber - 1, character: marker.startColumn - 1 }),
          )
          if (node !== undefined) {
            const start = textDocument.value.positionAt(node.offset)
            const end = textDocument.value.positionAt(node.offset + node.length)
            decorations.push({
              range: {
                startLineNumber: start.line + 1,
                startColumn: 1,
                endLineNumber: end.line + 1,
                endColumn: 1,
              },
              options: {
                isWholeLine: true,
                linesDecorationsClassName: 'line-error-decorator',
              },
            })
            decorations.push({
              range: {
                startLineNumber: marker.startLineNumber,
                startColumn: 1,
                endLineNumber: marker.endLineNumber,
                endColumn: 1,
              },
              options: {
                isWholeLine: true,
                className: 'line-error',
              },
            })
          }
        }

        editorDecorations = editor.getModel()?.deltaDecorations(editorDecorations, decorations) ?? []
      }
    }),
  )

  editorDisposables.push(
    monaco.languages.registerCompletionItemProvider('json', {
      triggerCharacters: [' ', ':', '"'],
      provideCompletionItems: async (model, position, context) => {
        const node = languageSpecificDocument.value.getNodeFromOffset(
          textDocument.value.offsetAt({
            line: position.lineNumber - 1,
            character: position.column - 1,
          }),
        )

        if (node?.type === 'string' && node.parent?.type === 'property' && node.parent.keyNode.value === 'service') {
          const nodePosition = textDocument.value.positionAt(node.offset)
          const replaceRange = {
            startLineNumber: nodePosition.line + 1,
            startColumn: nodePosition.character + 1, // including the opening quote
            endLineNumber: nodePosition.line + 1,
            endColumn: nodePosition.character + node.length + 1, // including the closing quote
          }
          console.log(`>${textDocument.value.getText({
            start: { line: replaceRange.startLineNumber - 1, character: replaceRange.startColumn - 1 },
            end: { line: replaceRange.endLineNumber - 1, character: replaceRange.endColumn - 1 },
          })}<`)

          const records = await searchForeignRecords('services', node.value)
          return {
            suggestions: records.map((service: any) => {
              const reference = JSON.stringify({ id: service.id }, null, 2).replace(/\n\s*/g, ' ')

              return {
                label: service.name,
                kind: monaco.languages.CompletionItemKind.Reference,
                additionalTextEdits: [{
                  range: replaceRange,
                  text: `${reference}${'$'.repeat(node.value.length)}`, // The paddings here are ESSENTIAL
                }],
                insertText: '', // Not used but have to be present
                detail: JSON.stringify(service, null, 2),
              }
            }),
            incomplete: true, // Disable filtering
          }
        }
      },
    }),
  )

  editor.setModel(model.value)
  updateSchemaUri(schema.value, uri.value)

  editor.focus()

  editorDisposables.push(editor)

  // jsonSchema.properties = {
  //   ...jsonSchema.properties,
  //   name: {
  //     type: 'string',
  //     default: props.name,
  //     enum: [props.name],
  //   },
  // }
  // jsonSchema.required?.push('name')

  // const jsonLanguageService = getLanguageService({})

  // configureMonacoYaml(monaco, {
  //   schemas: [
  //     {
  //       uri: 'kong://kong', // have to keep this or make this hidden in the lib
  //       fileMatch: ['*'],
  //       schema: yamlSchema,
  //     },
  //   ],
  // })
  // jsonModel = monaco.editor.createModel(prepareModel(jsonSchema), 'json', monaco.Uri.parse('file:///plugin.json'))
  // yamlModel = monaco.editor.createModel(YAML.stringify(prepareData(jsonSchema), { indent: 2 }), 'yaml', monaco.Uri.parse('file:///plugin.yaml'))

  // let jsonTextDocument = TextDocument.create(jsonModel.uri.toString(), 'json', 1, jsonModel.getValue())
  // let jsonJsonDocument = jsonLanguageService.parseJSONDocument(jsonTextDocument)

  // let previousDecorations: string[] = []

  // monaco.editor.onDidChangeMarkers(() => {
  //   const markers = monaco.editor.getModelMarkers({
  //     resource: jsonModel.uri,
  //   })

  // editor.onDidChangeCursorSelection(() => {
  //   const position = editor.getPosition()
  //   if (!position) {
  //     return
  //   }

  //   let node = jsonJsonDocument.getNodeFromOffset(jsonTextDocument.offsetAt({
  //     line: position.lineNumber - 1,
  //     character: position.column - 1,
  //   }))
  //   if (!node) {
  //     return
  //   }

  //   console.log('node:', node)

  //   const astNodes: ASTNode[] = []

  //   node = node.parent
  //   while (node) {
  //     switch (node.type) {
  //       case 'property': {
  //         astNodes.unshift(node)
  //         break
  //       }
  //     }
  //     node = node.parent
  //   }

  //   let schema: JSONSchema | undefined = jsonSchema
  //   for (const node of astNodes) {
  //     switch (node.type) {
  //       case 'property': {
  //         if (schema?.type !== 'object') {
  //           schema = undefined
  //           break
  //         }
  //         schema = schema.properties?.[node.keyNode.value] as JSONSchema | undefined
  //         break
  //       }
  //       case 'object': {
  //         if (schema?.type !== 'object') {
  //           schema = undefined
  //           break
  //         }
  //         break
  //       }
  //       case 'array': {
  //         if (schema?.type !== 'array') {
  //           schema = undefined
  //           break
  //         }
  //         schema = schema.items as JSONSchema | undefined
  //         break
  //       }
  //     }
  //   }

  //   focusedJSONSchema.value = schema
  // })
})
</script>

<style lang="scss" scoped>
.plugin-config-editor {
  display: flex;
  flex-direction: column;
  border: 2px solid rgba(0, 0, 0, 0.1);
  border-radius: 6px;

  .plugin-config-editor-toolbar {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    border-bottom: 2px solid rgba(0, 0, 0, 0.1);
    padding: 8px;

    .language-control {
      max-width: 300px;
    }
  }

  .plugin-config-editor-wrapper {
    display: flex;
    flex-direction: row;
    justify-content: space-between;

    .plugin-config-editor-editor {
      height: 500px;
      width: 100%;

      :deep(.line-error-decorator) {
        background-color: rgb(255, 220, 220);
        width: 5px !important;
        margin-left: 3px;
      }

      :deep(.line-error) {
        background-color: rgb(255, 0, 0, 0.05);
      }
    }

    .plugin-config-editor-panel {
      width: 300px;
      border-left: 2px solid rgba(0, 0, 0, 0.1);

      .suggested-properties-title {
        padding: 8px;
        font-weight: bold;
      }

      .suggested-properties {
        display: flex;
        flex-direction: column;

        .suggested-property {
          padding: 8px;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          cursor: pointer;
          transition: background-color linear 0.2s;

          &:hover {
            background-color: rgba(0, 0, 0, 0.05);
          }
        }
      }
    }
  }
}
</style>
