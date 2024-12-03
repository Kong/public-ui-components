import type { Ref } from 'vue'

/**
 * MarkReactiveInputRefs is a utility type that selectively wraps some properties in U of T with
 * `Ref<...>` to make `reactive(...)` accept refs for those properties, without modifying the original
 * shape.
 */
export type MarkReactiveInputRefs<T, U extends keyof T> = { [P in U]: Ref<T[P]> } & Omit<T, U>
