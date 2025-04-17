<template>
  <div
    ref="editorRef"
    class="entities-config-editor"
  />
</template>

<script setup lang="ts">
import type * as Monaco from 'monaco-editor'
import type { ForeignCompletionFetchers } from 'src/types/foreign'
import { type ASTNode } from 'vscode-json-languageservice'
import { onBeforeUnmount, onMounted, ref, toRefs, watch } from 'vue'
import composables from '../composables'
import { type EditorLanguage, type LuaSchema } from '../types'
import { setupMonaco } from '../utils'

const props = defineProps<{
  language: EditorLanguage
  id?: string
  luaSchema?: LuaSchema
  foreignFetchers?: ForeignCompletionFetchers
}>()

const monaco = await setupMonaco()

let editorDisposables: Monaco.IDisposable[] = []
let editor: Monaco.editor.IStandaloneCodeEditor
let editorDecorations: string[] = []

const editorRef = ref<HTMLElement>() // useTemplateRef does not work for this
const { language, id, luaSchema } = toRefs(props)

const focusedNode = ref<ASTNode | undefined>(undefined)

const { model, schema, uri, textDocument, languageSpecificDocument, onDidChangeModelContent } = composables.useMonacoEditor(monaco, language, id, luaSchema)

const updateModel = (model: Monaco.editor.ITextModel) => {
  editor.setModel(model)
}

const updateSchemaUri = (schema: any, uri: Monaco.Uri) => {
  const schemas = monaco.languages.json.jsonDefaults.diagnosticsOptions.schemas
  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: [
      ...schemas?.filter((s) => s.uri.toString() !== uri.toString()) ?? [],
      {
        uri: uri.toString(),
        fileMatch: [uri.toString()],
        schema,
      },
    ],
    schemaRequest: 'ignore',
    enableSchemaRequest: false,
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

// const FETCH_LIMIT = 1000

// const fetchForeignRecords = async (entity: string, params?: any, onDrained?: () => void) => {
//   const data = []
//   let offset = null

//   const fetchForeign = props.foreignFetchers?.[entity]
//   if (!fetchForeign) {
//     console.warn(`Attempted to fetch foreign ${entity} entities but the fetcher is not provided`)
//     return []
//   }

//   while (data.length < FETCH_LIMIT) {
//     const entities = await fetchForeign({
//       size: FETCH_LIMIT > 1000 ? 1000 : FETCH_LIMIT,
//       offset,
//       ...params,
//     })

//     data.push(...entities.data)
//     offset = entities.offset
//     if (!offset) break
//   }

//   // Report we have drained the data
//   if (data.length <= FETCH_LIMIT && !offset) {
//     console.log(entity, 'drained')
//     onDrained?.()
//   }

//   return data.slice(0, FETCH_LIMIT)
// }

// const foreignEntities = ref<Record<keyof ForeignCompletionFetchers, ForeignCompletionItem>>()

// onMounted(async () => {
//   if (props.foreignFetchers) {
//     const entities: Record<string, any> = {}
//     await Promise.all(
//       Object.entries(props.foreignFetchers).map(async ([kind, fetchFn]) => {
//         entities[kind] = await fetchFn({
//           size: FETCH_LIMIT,
//         })
//       }),
//     )
//     foreignEntities.value = entities
//   }
// })

// const searchForeignRecords = async (entity: string, query: string): Promise<any[]> => {
//   if (query.trim().length === 0) {
//     return []
//   }

//   if (foreignEntityDrained[entity]) {
//     // use prefetched result
//     console.log('using prefetched result')
//     return (await prefetchedServices).filter((item) => {
//       if (isValidUuid(query) && item.id === query) {
//         return true
//       }

//       if (item.name.includes(query)) {
//         return true
//       }

//       return false
//     })
//   }

//   const items: any[] = []
//   const promises = []
//   const fields = ['id', 'name'] // get from schema or something
//   const filteredIds = new Set()

//   promises.push(
//     ...fields
//       .filter((field) => field !== 'id')
//       .map(async (field) => {
//         const result = await fetchForeignRecords(entity, { [field]: query })
//         result.forEach((item) => {
//           if (!filteredIds.has(item.id)) {
//             filteredIds.add(item.id)
//             items.push(item)
//           }
//         })
//       }),
//   )
//   // }

//   await Promise.all(promises)

//   return items
// }

onBeforeUnmount(() => {
  editorDisposables.forEach((d) => d?.dispose())
})

const assertPropertyValueNode = (node: ASTNode, keyPath: string[]) => {
  if (node.type === 'property') {
    return false // "property" node is not a value node
  }

  let n: ASTNode | undefined = node.parent
  for (let i = keyPath.length - 1; i >= 0; i--) {
    if (!n || n.type !== 'property') {
      return false
    }
    if (n.keyNode.value !== keyPath[i]) {
      return false
    }
    n = n.parent
    if (!n || n.type !== 'object') {
      return false
    }
    n = n.parent
  }
  return n?.parent === undefined
}

onMounted(async () => {
  editor = monaco.editor.create(editorRef.value as HTMLElement, {
    theme: 'vs',
    quickSuggestions: {
      other: true,
      comments: false,
      strings: true, // Enable suggestions inside strings
    },
    automaticLayout: true,
    tabSize: 2,
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
    focusedNode.value = node
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

      if (!matchingUri) {
        return
      }
      const decorations: Monaco.editor.IModelDeltaDecoration[] = []
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

        editorDecorations = editor.getModel()?.deltaDecorations(editorDecorations, decorations) ?? []
      }
    }),
  )

  editorDisposables.push(
    monaco.languages.registerHoverProvider('json', {
      provideHover: async (model, position) => {
        const node = languageSpecificDocument.value.getNodeFromOffset(textDocument.value.offsetAt({
          line: position.lineNumber - 1,
          character: position.column - 1,
        }))


        if (!node) {
          return
        }

        if (assertPropertyValueNode(node, ['service', 'id'])) {
          return {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
            contents: [{
              value: 'TODO: Hovering on a service ID. Show something meaningful here.',
            }],
          }
        } else if (assertPropertyValueNode(node, ['service', 'name'])) {
          return {
            range: {
              startLineNumber: position.lineNumber,
              startColumn: position.column,
              endLineNumber: position.lineNumber,
              endColumn: position.column,
            },
            contents: [{
              value: 'TODO: Hovering on a service name. Show something meaningful here.',
            }],
          }
        }
      },
    }),
  )

  // editorDisposables.push(
  //   monaco.languages.registerCompletionItemProvider('json', {
  //     triggerCharacters: [' ', ':', '"'],
  //     provideCompletionItems: async (model, position) => {
  //       const node = languageSpecificDocument.value.getNodeFromOffset(
  //         textDocument.value.offsetAt({
  //           line: position.lineNumber - 1,
  //           character: position.column - 1,
  //         }),
  //       )

  //       if (node?.type === 'property' && node.keyNode.value === 'service') {
  //         return {
  //           suggestions: [
  //             {
  //               label: 'Search for a service',
  //               kind: monaco.languages.CompletionItemKind.Snippet,
  //               insertText: '"$1"',
  //               insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
  //               markdownDescription: [
  //                 '1. Search for a service by typing keywords inside the `""` (e.g. `"my-service"`)',
  //                 '2. Wait for the search results',
  //                 '3. Pick a service from the list',
  //               ].join('\n'),
  //               sortText: '_1',
  //             },
  //             {
  //               label: 'Provide a service ID',
  //               kind: monaco.languages.CompletionItemKind.Snippet,
  //               insertText: JSON.stringify({ id: '' }, null, 2).replace(/\n\s*/g, ' '),
  //               description: '',
  //               sortText: '_2',
  //             },
  //             {
  //               label: 'Provide a service name',
  //               kind: monaco.languages.CompletionItemKind.Snippet,
  //               insertText: JSON.stringify({ name: '' }, null, 2).replace(/\n\s*/g, ' '),
  //               description: '',
  //               sortText: '_3',
  //             },
  //           ],
  //         }
  //       } else if (node?.type === 'string' && node.parent?.type === 'property' && node.parent.keyNode.value === 'service') {
  //         const nodePosition = textDocument.value.positionAt(node.offset)
  //         const completionItemRange = {
  //           startLineNumber: nodePosition.line + 1,
  //           startColumn: nodePosition.character + 2,
  //           endLineNumber: nodePosition.line + 1,
  //           endColumn: nodePosition.character + node.length,
  //         }
  //         const replaceRange = {
  //           startLineNumber: nodePosition.line + 1,
  //           startColumn: nodePosition.character + 1, // including the opening quote
  //           endLineNumber: nodePosition.line + 1,
  //           endColumn: nodePosition.character + node.length + 1, // including the closing quote
  //         }

  //         const records = await searchForeignRecords('services', node.value)
  //         console.log('records:', records)

  //         return {
  //           suggestions: records.map((service: any) => {
  //             const reference = JSON.stringify({ id: service.id }, null, 2).replace(/\n\s*/g, ' ')

  //             return {
  //               label: service.name ? `${service.name} (${service.id})` : service.id,
  //               kind: monaco.languages.CompletionItemKind.Reference,
  //               additionalTextEdits: [
  //                 {
  //                   range: replaceRange,
  //                   text: `${reference}${'$'.repeat(node.value.length)}`, // The paddings here are ESSENTIAL
  //                 },
  //               ],
  //               insertText: '', // Not used but have to be present
  //               range: completionItemRange, // To suppress TS warnings and ensure it works
  //               detail: JSON.stringify(service, null, 2),
  //               filterText: node.value,
  //             }
  //           }),
  //           incomplete: true, // Disable filtering
  //         }
  //       }
  //     },
  //   }),
  // )

  editor.setModel(model.value)
  // model.value.setValue(JSON.stringify({
  //   'service': { 'id': 'cf1d88f6-cbb1-4068-9771-a128a846bafa' },
  // }, null, 2))

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
.entities-config-editor {
  border: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  // border-radius: 6px;

  .plugin-config-editor-toolbar {
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
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
      flex-grow: 1;
      height: 500px;

      :deep(.line-error-decorator) {
        background-color: rgb(255, 220, 220);
        margin-left: 3px;
        width: 5px !important;
      }

      :deep(.line-error) {
        background-color: rgb(255, 0, 0, 0.05);
      }
    }

    .plugin-config-editor-panel {
      border-left: 1px solid rgba(0, 0, 0, 0.1);
      padding: $kui-space-60;
      width: 300px;

      .suggested-properties-title {
        font-weight: bold;
        padding: 8px;
      }

      .suggested-properties {
        display: flex;
        flex-direction: column;

        .suggested-property {
          border-bottom: 1px solid rgba(0, 0, 0, 0.1);
          cursor: pointer;
          padding: 8px;
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
