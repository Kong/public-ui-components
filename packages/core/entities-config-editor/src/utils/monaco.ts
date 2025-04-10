import type * as Monaco from 'monaco-editor'

export const setupMonaco = async () => {
  const [EditorWorker, JSONWorker] = await Promise.all([
    import('monaco-editor/esm/vs/editor/editor.worker?worker').then(module => module.default),
    import('monaco-editor/esm/vs/language/json/json.worker?worker').then(module => module.default),
  ])

  window.MonacoEnvironment = {
    getWorker(_: any, label: string) {
      if (label === 'json') {
        return new JSONWorker()
      }
      return new EditorWorker()
    },
  }

  return await import('monaco-editor') as typeof Monaco
}
