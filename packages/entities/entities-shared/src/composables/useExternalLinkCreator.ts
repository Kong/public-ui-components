export default function useExternalLinkCreator(routeParams: string[]): string {
  const base = window.location.origin
  const baseUrl = base.endsWith('/') ? base : `${base}/`

  try {
    const path = routeParams.join('/')
    const fullUrl = `${baseUrl}${path}`
    const hasEmptyParams = routeParams.some(item => item.trim() === '')

    /* Test validity of generated URL */
    const urlRegex = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g // eslint-disable-line no-useless-escape

    /* eslint-disable no-new */
    if (!urlRegex.test(fullUrl) && !hasEmptyParams && new URL(fullUrl)) {
      return `${baseUrl}${path}`
    } else {
      throw new Error('Invalid url')
    }
  } catch (e) {
    console.warn('Failed to build valid URL:', e)

    return ''
  }
}
