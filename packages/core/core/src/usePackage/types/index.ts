type ScriptType = 'umd' | 'es'

interface PackageScript {
  /** String of the lib name defined in the component's vite.config.ts. Only required for UMD imports; ES imports can pass an empty string. Example: 'demo-component' or 'kong-ui-demo-component' */
  libName: string
  /** String of URL of script to import */
  url: string
  /** The type of the script bundle being imported, one of 'umd' or 'es'. Default is 'umd' */
  type?: ScriptType
}

export interface ImportParams {
  /** Script import config object */
  script: PackageScript,
  /** Style import config object */
  styles?: {
    /** Array of strings of CSS assets. */
    urls?: string[]
    /** Query selector string of the shadowRoot element if adding the styles to the shadowDOM. */
    shadowRoot?: string
  }
  /** Asynchronous function to call once package has been loaded. */
  onReady?: () => Promise<void>
}
