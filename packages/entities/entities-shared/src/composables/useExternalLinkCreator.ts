export default function useExternalLinkCreator(routeParams: string[]): string {
  const base = window.location.origin
  const baseUrl = base.endsWith('/') ? base : `${base}/`

  try {
    const path = routeParams.join('/')
    const fullUrl = `${baseUrl}${path}`
    const hasEmptyParams = routeParams.some(item => item.trim() === '')

    /* Test validity of generated URL */
    /* eslint-disable no-new */
    if (!hasEmptyParams && new URL(fullUrl)) {
      return `${baseUrl}${path}`
    } else {
      throw new Error('Invalid url')
    }
  } catch (e) {
    console.warn('Failed to build valid URL:', e)

    return ''
  }
}
