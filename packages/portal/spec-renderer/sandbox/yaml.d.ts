// YAML files are transformed into parsed objects by the `spec-renderer:transform-yaml`
// plugin defined in `vite.config.ts`.
declare module '*.yaml' {
  const value: Record<string, any>
  export default value
}

declare module '*.yml' {
  const value: Record<string, any>
  export default value
}
