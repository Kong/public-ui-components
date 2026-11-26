import { describe, it, expect, vi } from 'vitest'
import { Comment, Fragment, defineComponent, h, Text } from 'vue'
import { defineRevealAdapter, getRevealAdapter, updateModelValue } from './reveal-adapter'
import { coversFieldPath, findDeepest, flattenRevealTree, matchesContainer, scanRevealTree } from './reveal-tree'
import ObjectField from '../components/ObjectField.vue'
import '../reveal-adapters'
import * as freeform from '../index'

import type { VNode } from 'vue'
import type { RevealContainerNode, RevealNode } from './reveal-tree'

const Stub = (name: string) => defineComponent({ name, setup: () => () => null })

/** A field component: renders the field its `name` names */
const TestField = Stub('TestField')
defineRevealAdapter<{ name?: string, omit?: string[] }>(TestField, {
  field: props => props.name ? { path: props.name, exclude: props.omit } : undefined,
})

/** A container: each slot but `title` shows only while open */
const Tabs = Stub('Tabs')
const open = vi.fn()
defineRevealAdapter(Tabs, {
  contentSlots: slotName => slotName !== 'title',
  open,
})

/** An opaque component: renders fields in its own template */
const Opaque = Stub('Opaque')
defineRevealAdapter(Opaque, {
  fields: () => ['a', { path: 'b', exclude: ['c'] }],
})

/** No adapter: only its slots are scanned */
const Plain = Stub('Plain')

/** The tree with each node as a short string, e.g. `Tabs#first[a, b]` */
function describeTree(nodes: RevealNode[]): string[] {
  return nodes.map((node) => {
    if (node.kind === 'field') {
      return node.cover.exclude ? `${node.cover.path} -${node.cover.exclude.join(',')}` : node.cover.path
    }
    const name = (node.component as { name: string }).name
    return `${name}${node.key != null ? `(${String(node.key)})` : ''}#${node.slotName}[${describeTree(node.children).join(', ')}]`
  })
}

const scan = (vnodes: Parameters<typeof scanRevealTree>[0]) => describeTree(scanRevealTree(vnodes))

describe('scanRevealTree', () => {
  it('finds field components and leaves text and comments out', () => {
    expect(scan([
      h(TestField, { name: 'a' }),
      h(Text, 'text'),
      h(Comment, 'comment'),
      h(TestField, {}),
    ])).toEqual(['a'])
  })

  it('looks into elements and fragments', () => {
    expect(scan(h('div', [h(Fragment, [h(TestField, { name: 'a' })]), h('span', [h(TestField, { name: 'b' })])])))
      .toEqual(['a', 'b'])
  })

  it('resolves the names in a field\'s default slot against it, unless absolute', () => {
    expect(scan(h(TestField, { name: 'config' }, {
      default: () => [h(TestField, { name: 'redis' }), h(TestField, { name: '$.name' })],
      other: () => [h(TestField, { name: 'ignored' })],
    }))).toEqual(['config', 'config.redis', 'name'])
  })

  it('keeps what a field leaves out', () => {
    expect(scan(h(TestField, { name: 'tls', omit: ['client_cert'] }))).toEqual(['tls -client_cert'])
  })

  it('gives the built-in field components an adapter', () => {
    expect(scan(h(ObjectField, { name: 'tls', omit: ['verify'] }))).toEqual(['tls -verify'])
  })

  it('puts the fields of a container\'s content slots in a container node', () => {
    expect(scan(h(Tabs, { key: 'groups' }, {
      title: () => [h(TestField, { name: 'always' })],
      first: () => [h(TestField, { name: 'a' })],
      second: () => [h(Tabs, null, { inner: () => [h(TestField, { name: 'b' })] })],
    }))).toEqual(['always', 'Tabs(groups)#first[a]', 'Tabs(groups)#second[Tabs#inner[b]]'])
  })

  it('takes the fields an adapter names, relative to the field around it', () => {
    expect(scan(h(TestField, { name: 'config' }, { default: () => [h(Opaque)] })))
      .toEqual(['config', 'config.a', 'config.b -c'])
  })

  it('scans the slots of a component with no adapter, not its template', () => {
    expect(scan(h(Plain, null, {
      default: () => [h(TestField, { name: 'a' })],
      footer: () => [h(TestField, { name: 'b' })],
    }))).toEqual(['a', 'b'])
  })

  it('skips a slot that throws without its slot props', () => {
    expect(scan(h(Plain, null, {
      default: (props: { item: { name: string } }) => [h(TestField, { name: props.item.name })],
      footer: () => [h(TestField, { name: 'b' })],
    }))).toEqual(['b'])
  })

  it('opens a container through its adapter', () => {
    const vnode = h(Tabs, { modelValue: 'first' }, { second: () => [h(TestField, { name: 'a' })] })
    const [container] = scanRevealTree(vnode) as RevealContainerNode[]
    container.open()
    expect(open).toHaveBeenCalledWith({ vnode, props: { modelValue: 'first' }, slotName: 'second' })
  })
})

describe('flattenRevealTree', () => {
  it('lists each field with the containers it sits in, outermost first', () => {
    const tree = scanRevealTree([
      h(TestField, { name: 'top' }),
      h(Tabs, null, { first: () => [h(Tabs, null, { inner: () => [h(TestField, { name: 'deep' })] })] }),
    ])
    const fields = flattenRevealTree(tree)
    expect(fields.map(field => [field.path, field.containers.map(node => node.slotName)])).toEqual([
      ['top', []],
      ['deep', ['first', 'inner']],
    ])
  })
})

describe('coversFieldPath', () => {
  it('covers the field itself and everything below it', () => {
    expect(coversFieldPath({ path: 'tls' }, 'tls')).toBe(true)
    expect(coversFieldPath({ path: 'tls' }, 'tls.client_cert')).toBe(true)
    expect(coversFieldPath({ path: 'tls' }, 'tls_verify')).toBe(false)
    expect(coversFieldPath({ path: 'tls' }, 'config')).toBe(false)
  })

  it('leaves out the children it excludes', () => {
    const cover = { path: 'tls', exclude: ['client_cert'] }
    expect(coversFieldPath(cover, 'tls.client_cert')).toBe(false)
    expect(coversFieldPath(cover, 'tls.client_cert.pem')).toBe(false)
    expect(coversFieldPath(cover, 'tls.verify')).toBe(true)
  })
})

describe('findDeepest', () => {
  it('finds the deepest cover of a path', () => {
    const covers = [{ path: 'config' }, { path: 'config.redis', id: 1 }, { path: 'config.redis', id: 2 }, { path: 'other' }]
    expect(findDeepest(covers, 'config.redis.host')).toEqual({ path: 'config.redis', id: 1 })
    expect(findDeepest(covers, 'config.ttl')).toEqual({ path: 'config' })
    expect(findDeepest(covers, 'name')).toBeNull()
  })

  it('skips a cover that leaves the path out', () => {
    expect(findDeepest([{ path: 'config' }, { path: 'config.redis', exclude: ['host'] }], 'config.redis.host'))
      .toEqual({ path: 'config' })
  })
})

describe('matchesContainer', () => {
  const [container] = scanRevealTree(h(Tabs, { key: 'groups' }, { first: () => [] })) as RevealContainerNode[]

  it('matches by component, and by key and slot when given', () => {
    expect(matchesContainer(container, { component: Tabs })).toBe(true)
    expect(matchesContainer(container, { component: Tabs, key: 'groups', slotName: 'first' })).toBe(true)
    expect(matchesContainer(container, { component: Tabs, key: 'other' })).toBe(false)
    expect(matchesContainer(container, { component: Tabs, slotName: 'second' })).toBe(false)
    expect(matchesContainer(container, { component: Opaque })).toBe(false)
  })
})

describe('updateModelValue', () => {
  it('calls the `onUpdate:modelValue` the parent binds', () => {
    const update = vi.fn()
    updateModelValue({ props: { 'onUpdate:modelValue': update } } as unknown as VNode, '#first')
    expect(update).toHaveBeenCalledWith('#first')
  })

  it('calls each of several listeners', () => {
    const first = vi.fn()
    const second = vi.fn()
    updateModelValue({ props: { 'onUpdate:modelValue': [first, second] } } as unknown as VNode, false)
    expect(first).toHaveBeenCalledWith(false)
    expect(second).toHaveBeenCalledWith(false)
  })

  it('warns when the parent binds no `v-model`', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
    updateModelValue({ props: {}, type: Tabs } as unknown as VNode, false)
    expect(warn).toHaveBeenCalledOnce()
    warn.mockRestore()
  })
})

describe('the built-in field components', () => {
  // A field component the scan doesn't know is not found before it mounts, e.g. in an inactive tab
  const fieldComponents = Object.entries(freeform).filter(([name, value]) => name.endsWith('Field') && typeof value === 'object')

  it('finds them all', () => {
    expect(fieldComponents.length).toBeGreaterThanOrEqual(13)
  })

  it.each(fieldComponents)('gives %s an adapter', (_, component) => {
    expect(getRevealAdapter(component)?.field).toBeTypeOf('function')
  })
})
