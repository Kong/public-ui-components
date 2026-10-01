// Ambient declaration for the virtual specifier `monaco-loader.ts` imports instead of the
// real `'shiki'` package
declare module 'virtual:@kong-ui-public/monaco-editor/shiki' {
  export * from 'shiki'
}
