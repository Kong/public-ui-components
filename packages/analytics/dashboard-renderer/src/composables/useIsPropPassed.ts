import type { Ref } from 'vue'
import { getCurrentInstance, onBeforeUpdate, readonly, ref } from 'vue'

/**
 * Reports whether the parent passed a prop, including an explicit `undefined`.
 * Vue resolves an omitted prop and an `undefined` prop to the same value, so this
 * reads the raw vnode props. It refreshes before each update, because the parent
 * can start or stop passing the prop.
 *
 * @param name - The prop name as the parent passes it.
 * @returns `true` while the parent passes the prop.
 */
export default function useIsPropPassed(name: string): Readonly<Ref<boolean>> {
  const instance = getCurrentInstance()
  const readIsPassed = (): boolean => !!instance?.vnode.props && name in instance.vnode.props

  const isPassed = ref(readIsPassed())

  onBeforeUpdate(() => {
    isPassed.value = readIsPassed()
  })

  return readonly(isPassed)
}
