import { Comment, Fragment, Text, isVNode } from 'vue'
import * as utils from '../utils'
import { getRevealAdapter } from './reveal-adapter'

import type { Component, VNode, VNodeChild } from 'vue'
import type { FieldCover } from './reveal-adapter'

/** A field the form's content renders, mounted or not */
export interface RevealFieldNode {
  kind: 'field'
  cover: FieldCover
}

/** A slot of a container that shows its content only while opened, e.g. a tab's panel */
export interface RevealContainerNode {
  kind: 'container'
  component: Component
  /** The vnode's `key`, to tell containers of the same component apart */
  key: VNode['key']
  slotName: string
  open: () => void
  children: RevealNode[]
}

export type RevealNode = RevealFieldNode | RevealContainerNode

/** Deeper than any real form; stops a slot that renders itself */
const MAX_DEPTH = 64

/** A `name` prop, resolved as `useFieldPath` does: relative to the field around it */
function resolveName(base: string, name: string): string {
  if (utils.isAbsolute(name)) {
    return name.slice(utils.resolveRoot('').length)
  }
  return base ? utils.resolve(base, name) : name
}

function toCover(base: string, cover: string | FieldCover): FieldCover {
  return typeof cover === 'string'
    ? { path: resolveName(base, cover) }
    : { path: resolveName(base, cover.path), exclude: cover.exclude }
}

/** The slots of a component vnode, as functions */
function getSlots(vnode: VNode): Array<[string, (...args: any[]) => VNodeChild]> {
  const { children } = vnode
  if (Array.isArray(children)) {
    return [['default', () => children]]
  }
  if (children && typeof children === 'object') {
    return Object.entries(children).filter((entry): entry is [string, (...args: any[]) => VNodeChild] =>
      entry[0] !== '_' && typeof entry[1] === 'function')
  }
  return []
}

/**
 * Renders a slot to vnodes without mounting them. Its props are unknown here,
 * so a slot that needs them may throw: it then holds no field the form knows of.
 */
function renderSlot(slot: (...args: any[]) => VNodeChild): VNodeChild {
  try {
    return slot({})
  } catch {
    return null
  }
}

function scanChildren(children: VNodeChild, base: string, depth: number): RevealNode[] {
  if (depth > MAX_DEPTH) {
    return []
  }
  if (Array.isArray(children)) {
    return children.flatMap(child => scanChildren(child, base, depth))
  }
  return isVNode(children) ? scanVNode(children, base, depth) : []
}

function scanVNode(vnode: VNode, base: string, depth: number): RevealNode[] {
  const { type } = vnode
  if (type === Text || type === Comment) {
    return []
  }
  // Elements, fragments, teleports: their children show with them
  if (typeof type === 'string' || type === Fragment || !(typeof type === 'object' || typeof type === 'function') || '__isTeleport' in type) {
    return Array.isArray(vnode.children) ? scanChildren(vnode.children as VNodeChild, base, depth + 1) : []
  }

  const adapter = getRevealAdapter(type)
  const props = vnode.props ?? {}

  const field = adapter?.field?.(props)
  if (field?.path) {
    const cover = toCover(base, field)
    const inner = getSlots(vnode)
      .filter(([name]) => name === 'default')
      .flatMap(([, slot]) => scanChildren(renderSlot(slot), cover.path, depth + 1))
    return [{ kind: 'field', cover }, ...inner]
  }

  const own: RevealNode[] = (adapter?.fields?.(props) ?? []).map(cover => ({ kind: 'field', cover: toCover(base, cover) }))

  const inner = getSlots(vnode).flatMap(([slotName, slot]): RevealNode[] => {
    const children = scanChildren(renderSlot(slot), base, depth + 1)
    if (!adapter?.contentSlots?.(slotName)) {
      return children
    }
    return [{
      kind: 'container',
      component: type as Component,
      key: vnode.key,
      slotName,
      open: () => adapter.open?.({ vnode, props, slotName }),
      children,
    }]
  })

  return [...own, ...inner]
}

/**
 * Finds the fields that vnodes render and the containers they sit in, without
 * mounting them. It renders the slots of components to read them, so the
 * content of a closed container (e.g. an inactive tab) is found too. A
 * component's own template is not rendered: what it renders is up to its
 * `RevealAdapter`.
 *
 * @param base The field path the vnodes' field names are relative to
 */
export function scanRevealTree(vnodes: VNodeChild, base = ''): RevealNode[] {
  return scanChildren(vnodes, base, 0)
}

/** Whether a cover stands for the field at `fieldPath`, see `entryCovers` */
export function coversFieldPath(cover: FieldCover, fieldPath: string): boolean {
  if (fieldPath === cover.path) {
    return true
  }
  if (!utils.isWithinPath(fieldPath, cover.path)) {
    return false
  }
  const child = utils.toArray(fieldPath)[utils.toArray(cover.path).length]
  return !cover.exclude?.includes(child)
}

/** Every field node in the tree */
export function collectFieldCovers(nodes: RevealNode[]): FieldCover[] {
  return nodes.flatMap(node => node.kind === 'field' ? [node.cover] : collectFieldCovers(node.children))
}

/**
 * The containers to open, outermost first, to show the field that most closely
 * stands for `fieldPath` (the deepest cover), or `null` when no field covers it
 */
export function findRevealChain(nodes: RevealNode[], fieldPath: string): RevealContainerNode[] | null {
  let found: RevealContainerNode[] | null = null
  let foundDepth = -1

  function walk(list: RevealNode[], chain: RevealContainerNode[]) {
    for (const node of list) {
      if (node.kind === 'container') {
        walk(node.children, [...chain, node])
        continue
      }
      if (!coversFieldPath(node.cover, fieldPath)) {
        continue
      }
      const depth = utils.toArray(node.cover.path).length
      if (depth > foundDepth) {
        found = chain
        foundDepth = depth
      }
    }
  }

  walk(nodes, [])
  return found
}

/** Picks the containers of a tree, e.g. to count the errors in a tab */
export interface RevealContainerQuery {
  component: Component
  slotName?: string
  key?: VNode['key']
}

export function findContainers(nodes: RevealNode[], query: RevealContainerQuery): RevealContainerNode[] {
  return nodes.flatMap((node): RevealContainerNode[] => {
    if (node.kind !== 'container') {
      return []
    }
    const matches = node.component === query.component
      && (query.slotName === undefined || node.slotName === query.slotName)
      && (query.key === undefined || node.key === query.key)
    return [...(matches ? [node] : []), ...findContainers(node.children, query)]
  })
}
