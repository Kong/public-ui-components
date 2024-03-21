import type { FlameChartNode } from '@kong/flame-chart-js'
import type { ExtendedFlameNode } from 'src/types'

export const toExtendedFlameChartNodes = (
  foldedStacks: string[],
): ExtendedFlameNode[] => {
  foldedStacks.sort() // FIXME(Makito): Should we sort here or use tree traversal?

  const root: ExtendedFlameNode = {
    name: '$root',
    duration: 0,
    start: 0,
    children: [],

    internals: {
      root: true,
      children: {},
      selfDuration: 0,
      depth: -1,
    },
  }

  let maxDepth = 0

  for (const line of foldedStacks) {
    const i = line.lastIndexOf(' ')
    const frames = line.slice(0, i).split(';')
    if (frames.length > maxDepth) {
      maxDepth = frames.length
    }

    const count = Number(line.slice(i + 1))

    let node = root
    let depth = 0

    for (const [i, name] of frames.entries()) {
      if (!(name in node.internals.children!)) {
        const n: ExtendedFlameNode = {
          name,
          start: 0, // update later
          duration: 0,
          children: [],

          internals: {
            children: {},
            selfDuration: 0,
            depth,
          },
        }

        if (node.internals.root === undefined) {
          n.internals.parent = node
        }

        node.children.push(n)
        node.internals.children![name] = n
      }

      if (i === frames.length - 1) {
        // Correct the duration
        node.internals.children![name].duration = Number(count)
      } else {
        node.internals.children![name].duration += Number(count)
      }

      node = node.internals.children![name]
      depth++
    }
  }

  const queue: ExtendedFlameNode[] = [root]

  while (queue.length > 0) {
    const node = queue.shift()!

    node.internals.selfDuration =
      node.duration - node.children.reduce((d, c) => d + c.duration, 0)
    node.children.sort((a, b) => b.duration - a.duration)

    let start = node.start

    for (const child of node.children) {
      child.start = start
      start += child.duration
    }

    if (node.internals.depth >= 0) {
      node.color = `hsl(${(node.internals.depth / maxDepth) * 50}, 100%, 70%)`
    }

    queue.push(...node.children)
  }

  return root.children
}

export const getTailNodes = (root: ExtendedFlameNode) => {
  const nodes = [root]

  for (let i = 0; i < nodes.length; i++) {
    nodes.push(...nodes[i].children)
  }

  return nodes.filter((n) => n.internals.selfDuration > 0)
}

export const toFlattenParents = (
  nodes: ExtendedFlameNode[],
): Record<string, ExtendedFlameNode[]> => {
  const parentMap: Record<string, Record<string, ExtendedFlameNode>> = {}

  const queue = [...nodes]

  while (queue.length > 0) {
    const node = queue.shift()!

    if (!(node.name in parentMap)) {
      parentMap[node.name] = {}
    }

    if (node.internals.parent) {
      parentMap[node.name][node.internals.parent.name] = node.internals.parent
    }

    if (node.children.length > 0) {
      queue.push(...node.children)
    }
  }

  return Object.fromEntries(
    Object.entries(parentMap).map(([name, map]) => [name, Object.values(map)]),
  )
}
