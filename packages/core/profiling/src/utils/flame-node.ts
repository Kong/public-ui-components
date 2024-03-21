import type { ExtendedFlameNode } from 'src/types'

export const getLeafNodes = (root: ExtendedFlameNode): ExtendedFlameNode[] => {
  const nodes = [root]
  const nodeMap: Record<string, ExtendedFlameNode> = {}
  const leafNodes = []

  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i]
    if (node.children.length === 0) {
      leafNodes.push(node)
    } else {
      nodes.push(...node.children)
    }
  }

  return leafNodes
}
