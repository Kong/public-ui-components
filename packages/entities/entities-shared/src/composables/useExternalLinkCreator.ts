export default function useExternalLinkCreator(routeParams: string[]): string {
  const base = window.location.origin
  const baseUrl = base.endsWith('/') ? base : `${base}/`

  try {
    const path = routeParams.join('/')

    /* Test validity of generated URL */
    /* eslint-disable no-new */
    new URL(`${baseUrl}${path}`)

    return `${baseUrl}${path}`
  } catch (e) {
    console.warn('Failed to build valid URL:', e)

    return ''
  }
}
