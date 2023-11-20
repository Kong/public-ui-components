export default function useExternalLinkCreator(routeParams: string[]): string {
  const base = window.location.origin
  const baseUrl = base.endsWith('/') ? base : `${base}/`

  try {
    const path = routeParams.join('/')
    const fullUrl = `${baseUrl}${path}`
    const hasEmptyParams = routeParams.some(item => item.trim() === '')

    // Test validity of generated URL; only allows `http` protocal if domain is `localhost`
    /* eslint-disable-next-line no-useless-escape */
    const validUrlRegex = /^(https:\/\/(www\.)?([a-zA-Z0-9-]+\.){1,}[a-zA-Z]{2,}(:[0-9]+)?(\/[^\/]*)*)$|^http:\/\/localhost(:[0-9]+)?(\/[^\/]*)*$/

    /* eslint-disable no-new */
    if (validUrlRegex.test(fullUrl) && !hasEmptyParams && new URL(fullUrl)) {
      return `${baseUrl}${path}`
    } else {
      throw new Error('Invalid url')
    }
  } catch (e) {
    console.warn('Failed to build valid URL:', e)

    return ''
  }
}
