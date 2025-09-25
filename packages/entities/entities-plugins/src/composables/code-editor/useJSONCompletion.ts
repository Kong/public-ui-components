import type * as Monaco from 'monaco-editor'
import * as monaco from 'monaco-editor'

export const useJSONCompletion = (): Monaco.languages.CompletionItemProvider => ({
  triggerCharacters: [' ', ':', '"'],
  provideCompletionItems: async (model, position) => {

    const workerGetter = await monaco.languages.json.getWorker()
    const worker = await workerGetter()
    const ast = await worker.parseJSONDocument(model.uri.toString())
    console.log('ast:', ast)

    const node = ast?.getNodeFromOffset(model.getOffsetAt(position))
    console.log('node:', node)

    if (node?.type === 'property' && node.keyNode.value === 'service') {
      return {
        suggestions: [
          {
            label: 'Search for a service',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: '"$1"',
            insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
            markdownDescription: [
              '1. Search for a service by typing keywords inside the `""` (e.g. `"my-service"`)',
              '2. Wait for the search results',
              '3. Pick a service from the list',
            ].join('\n'),
            sortText: '_1',
          },
          {
            label: 'Provide a service ID',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: JSON.stringify({ id: '' }, null, 2).replace(/\n\s*/g, ' '),
            description: '',
            sortText: '_2',
          },
          {
            label: 'Provide a service name',
            kind: monaco.languages.CompletionItemKind.Snippet,
            insertText: JSON.stringify({ name: '' }, null, 2).replace(/\n\s*/g, ' '),
            description: '',
            sortText: '_3',
          },
        ],
      }
    } else if (node?.type === 'string' && node.parent?.type === 'property' && node.parent.keyNode.value === 'service') {
      const nodePosition = textDocument.value.positionAt(node.offset)
      const completionItemRange = {
        startLineNumber: nodePosition.line + 1,
        startColumn: nodePosition.character + 2,
        endLineNumber: nodePosition.line + 1,
        endColumn: nodePosition.character + node.length,
      }
      const replaceRange = {
        startLineNumber: nodePosition.line + 1,
        startColumn: nodePosition.character + 1, // including the opening quote
        endLineNumber: nodePosition.line + 1,
        endColumn: nodePosition.character + node.length + 1, // including the closing quote
      }

      const records = await searchForeignRecords('services', node.value)
      console.log('records:', records)

      return {
        suggestions: records.map((service: any) => {
          const reference = JSON.stringify({ id: service.id }, null, 2).replace(/\n\s*/g, ' ')

          return {
            label: service.name ? `${service.name} (${service.id})` : service.id,
            kind: monaco.languages.CompletionItemKind.Reference,
            additionalTextEdits: [
              {
                range: replaceRange,
                text: `${reference}${'$'.repeat(node.value.length)}`, // The paddings here are ESSENTIAL
              },
            ],
            insertText: '', // Not used but have to be present
            range: completionItemRange, // To suppress TS warnings and ensure it works
            detail: JSON.stringify(service, null, 2),
            filterText: node.value,
          }
        }),
        incomplete: true, // Disable filtering
      }
    }
  },
})
