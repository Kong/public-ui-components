import { createRouter, createMemoryHistory } from 'vue-router'

/**
 * Create mock routes in a mock router. Use in your cypress tests like so:
 *
 *   const router = await createMockRouter({ component, urls: ['/some/path'] })
 *   mount(component, {
 *     global: {
 *       plugins: [router],
 *     },
 *   })
 */
export async function createMockRouter({
  component,
  urls,
}: {
  component: any
  urls: string[]
}) {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: Array.from(new Set(urls)).map((url) => ({
      path: url,
      component,
    })),
  })

  urls.forEach((url) => {
    router.push(url)
  })

  await router.isReady()

  return router
}
