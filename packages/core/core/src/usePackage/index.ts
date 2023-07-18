import { ref, Ref, readonly, computed, ComputedRef, nextTick } from 'vue'
import type { ImportParams } from './types'

export default function usePackage({ script, styles, onReady }: ImportParams): {
  importPackage: () => Promise<any>,
  loadingPackage: Ref<boolean>,
  loadingStyles: Ref<boolean>,
} {
  // Loading state
  const loadingPackage: Ref<boolean> = ref(true)
  const loadingStyles: Ref<boolean> = ref(true)

  /**
   * Private function to import scripts via native ES import
   */
  const importScripts = async (): Promise<any> => {
    // Create an array to store the requests we need to make
    const { libName, url, type } = script
    const importType = type !== undefined && ['umd', 'es'].includes(type) ? type : 'umd'

    // Import ES Module(s)
    if (importType === 'es') {
      await import(/* @vite-ignore */url)

      // Call onReady function now that package is imported
      if (typeof onReady === 'function') {
        await onReady()
      }

      return
    }

    // Must prefix with `kong-ui-`
    const globalLibVariable = libName.startsWith('kong-ui-') ? libName : `kong-ui-${libName}`

    // If the package global is already bound to the window, return the existing object
    // @ts-ignore
    if (window[globalLibVariable]) return window[globalLibVariable]

    // Scripts is a umd file, so inject into the document.head
    // @ts-ignore
    window[globalLibVariable] = await new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.async = true
      script.addEventListener('load', async () => {
        // Call onReady function now that package is imported
        if (typeof onReady === 'function') {
          await onReady()
        }

        // Set loadingPackage ref to false after calling the optional onReady() callback
        loadingPackage.value = false

        // @ts-ignore
        resolve(window[globalLibVariable])
      })
      script.addEventListener('error', () => {
        reject(new Error(`Could not load '${globalLibVariable}' from ${url}`))
      })
      script.src = url
      document.head.appendChild(script)
    })

    // @ts-ignore
    return window[globalLibVariable]
  }

  /**
   * Private function to add `<link rel="stylesheet" href="" >` tags to the document.head, or within the shadowRoot.
   */
  const importStyles = async (styleUrls: string[], shadowRoot?: string): Promise<void> => {
    for (const url of styleUrls) {
      const styleLink = document.createElement('link')

      styleLink.type = 'text/css'
      styleLink.rel = 'stylesheet'
      styleLink.href = url

      const stylesParent = shadowRoot ? document.querySelector(shadowRoot) : null
      const shadowRootElement = shadowRoot ? stylesParent?.shadowRoot?.children[0] : null

      if (stylesParent && shadowRootElement) {
        try {
          shadowRootElement.appendChild(styleLink)
        } catch (err) {
          document.head.appendChild(styleLink)
        }
      } else {
        document.head.appendChild(styleLink)
      }
    }
  }

  /**
   * Import the package scripts/modules and corresponding CSS files - should only be called within the Vue `setup` function inside `defineAsyncComponent` or the `onBeforeMount` hooks.
   */
  const importPackage = async (): Promise<any> => {
    if (!script || !script.url || typeof window === 'undefined' || typeof document === 'undefined') return

    const useShadowDom: ComputedRef<boolean> = computed((): boolean => Boolean(styles && styles?.urls && styles?.urls.length && styles.shadowRoot))

    // If no styles are being imported, set loadingStyles ref to false
    if (!styles || !styles?.urls || !styles?.urls?.length) {
      loadingStyles.value = false
    }

    // If injecting styles and NOT utilizing the shadowDOM, add the styles
    // to the document.head before mounting the component
    if (styles?.urls && styles?.urls?.length && !useShadowDom.value) {
      await importStyles(styles.urls)
      loadingStyles.value = false
    }

    // If loading a UMD bundle
    if ((!script.type || script.type === 'umd') && !useShadowDom.value) {
      // Since this is a UMD bundle, we MUST return the result of the importScripts function call
      // in order to pass the component to the consuming app.
      return await importScripts()
    }

    // We're loading an ES Module, so do NOT return the result of the importScripts function call
    await importScripts()

    // Await a DOM refresh so that element(s) are potentially added to the DOM
    await nextTick()

    // Always set loadingPackage ref to false after calling the optional onReady() callback
    loadingPackage.value = false

    // If injecting styles and ARE utilizing the shadowDOM, add the styles into the shadowRoot
    if (styles?.urls && useShadowDom.value) {
      // Since we are appending styles to the shadowRoot, this must be called AFTER
      // loadingPackage has been set to true and after the user onReady() callback to
      // ensure that the element is hopefully present in the DOM.
      await importStyles(styles.urls, styles?.shadowRoot)

      // Await a DOM refresh so that styles are present in the DOM
      await nextTick()

      loadingStyles.value = false
    }
  }

  return {
    importPackage,
    loadingPackage: readonly(loadingPackage),
    loadingStyles: readonly(loadingStyles),
  }
}
