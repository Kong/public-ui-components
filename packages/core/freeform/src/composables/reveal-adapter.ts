import type { VNode } from 'vue'

/**
 * A field a part of the form covers: the field at `path` and everything below
 * it, except the children named in `exclude` (e.g. `ObjectField`'s `omit`)
 */
export interface FieldCover {
  path: string
  exclude?: string[]
}

export interface RevealAdapterContext<P = Record<string, any>> {
  /** The component's vnode, as the form's content renders it now */
  vnode: VNode
  props: P
  /** The slot that holds the field being revealed */
  slotName: string
}

/**
 * Tells the form what a component does with fields, so a reveal can find the
 * fields its content holds without the content being mounted (e.g. an inactive
 * tab), and open it.
 */
export interface RevealAdapter<P = Record<string, any>> {
  /**
   * For a field component: the field it renders, named as its `name` prop is.
   * The fields in its default slot are relative to it.
   */
  field?: (props: P) => FieldCover | undefined
  /**
   * For a component that renders fields in its own template, which the form
   * can't see until it mounts: those fields, named as a `name` prop would be.
   */
  fields?: (props: P) => Array<string | FieldCover>
  /**
   * For a container: the slots whose content shows only while it opens them,
   * e.g. a tab's panel. Its other slots always show.
   */
  contentSlots?: (slotName: string) => boolean
  /**
   * Opens a content slot. Only view state should change, e.g. by calling the
   * vnode's `onUpdate:modelValue`.
   */
  open?: (context: RevealAdapterContext<P>) => void
}

const adapters = new WeakMap<object, RevealAdapter<any>>()

/**
 * Tells the form what a component does with fields (see `RevealAdapter`).
 * Register it once per component, e.g. next to where the component is defined.
 */
export function defineRevealAdapter<P = Record<string, any>>(component: object, adapter: RevealAdapter<P>) {
  adapters.set(component, adapter)
}

export function getRevealAdapter(component: unknown): RevealAdapter | undefined {
  return typeof component === 'object' || typeof component === 'function'
    ? adapters.get(component as object)
    : undefined
}

/**
 * Asks the parent of a vnode to set its `v-model`, as the component would
 * when the user changes it. Warns when the parent binds no `v-model`, so
 * there is no state to set.
 */
export function updateModelValue(vnode: VNode, value: unknown) {
  const update = vnode.props?.['onUpdate:modelValue']
  if (typeof update === 'function') {
    update(value)
  } else if (Array.isArray(update)) {
    update.forEach(fn => fn(value))
  } else {
    console.warn('[FreeForm] A reveal can open a container only through its `v-model`, which it has none of:', vnode.type)
  }
}
