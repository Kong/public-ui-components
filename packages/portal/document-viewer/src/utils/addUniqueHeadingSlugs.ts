import { HeadingNode, isHeadingNode, isTextNode } from 'src/types'
import { toSlug } from './toSlug'
export function addUniqueHeadingSlugs<T = any>(children: Array<T>): Array<T> {

  if (!children) return children

  const slugMap = new Map<string, number>()
  // loop through the children
  // if the child is a heading, add a slug property based on the text
  return children.map((child: any) => {
    if (isHeadingNode(child)) {
      return addSlug(child, slugMap)
    } else {
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
  const slugCount = slugMap.get(text)
  slugMap.set(text, (slugCount || 0) + 1)
  const duplicateSuffix = slugCount && slugCount > 1 ? `-${slugCount}` : ''
  // add a hyphen if there are multiple headings with the same text
  const slug = prefix + toSlug(text, duplicateSuffix)
  return {
    ...child,
    slug,
  }
}
