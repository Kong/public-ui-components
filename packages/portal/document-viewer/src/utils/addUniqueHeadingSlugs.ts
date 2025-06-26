import type { HeadingNode } from '../types'
import { isHeadingNode, isTextNode } from '../types'
import { toSlug } from './toSlug'
export function addUniqueHeadingSlugs<T = any>(children: T[], slugMap = new Map<string, number>()): T[] {
  if (!children) return children

  const slugs = slugMap || new Map<string, number>()
  // loop through the children
  // if the child is a heading, add a slug property based on the text
  return children.map((child: any) => {
    if (isHeadingNode(child)) {
      return addSlug(child, slugMap)
    } else {
      // Nested headers are possible
      if (child.children) {
        child.children = addUniqueHeadingSlugs(child.children, slugs)
      }
      return child
    }
  })
}

export function addSlug(child: HeadingNode, slugMap: Map<string, number>, prefix = 'doc-heading-') {
  const firstChild = child.children?.[0]
  const defaultText = `level-${child.level}`
  const text = isTextNode(firstChild)
    ? firstChild.text || defaultText
    : defaultText
  const slugCount = (slugMap.get(text) || 0) + 1
  slugMap.set(text, slugCount)
  const duplicateSuffix = slugCount > 1 ? `-${slugCount}` : ''
  // add a hyphen if there are multiple headings with the same text
  const slug = prefix + toSlug(text, duplicateSuffix)

  return {
    ...child,
    slug,
  }
}
