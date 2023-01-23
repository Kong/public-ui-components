import { Component } from 'vue'
import { BaseNode } from '../types'
import Blockquote from './nodes/Blockquote.vue'
import Code from './nodes/Code.vue'
import CodeBlock from './nodes/CodeBlock.vue'
import Emphasis from './nodes/Emphasis.vue'
import Heading from './nodes/Heading.vue'
import Image from './nodes/Image.vue'
import LineBreak from './nodes/LineBreak.vue'
import Table from './nodes/Table.vue'
import TableRow from './nodes/TableRow.vue'
import TableCell from './nodes/TableCell.vue'
import Text from './nodes/Text.vue'
import TextBlock from './nodes/TextBlock.vue'
import Paragraph from './nodes/Paragraph.vue'
import List from './nodes/List.vue'
import ListItem from './nodes/ListItem.vue'
import Link from './nodes/Link.vue'

// The node to component mapping is currently static but may change in the future
const nodeTypeToComponentMap: Record<string, Component> = {
  blockquote: Blockquote,
  code: Code,
  code_block: CodeBlock,
  emphasis: Emphasis,
  heading: Heading,
  image: Image,
  line_break: LineBreak,
  link: Link,
  list: List,
  list_item: ListItem,
  paragraph: Paragraph,
  table: Table,
  table_row: TableRow,
  table_cell: TableCell,
  text: Text,
  text_block: TextBlock,
}

const nodeTypesNotified: Array<string> = []
function notifyUnknownNodeType(type: string) {
  if (nodeTypesNotified.indexOf(type) !== -1) {
    return
  }

  nodeTypesNotified.push(type)
  console.warn(`[DocumentViewer] Unable to render an unknown node type "${type}"`)
}

export default function renderChildren<ChildTypes extends BaseNode>(children: Array<ChildTypes>, parent?: BaseNode): Component {
  return children.map((child) => {
    if (!child) {
      return null
    }

    const { type, children, ...restProps } = child
    const component = nodeTypeToComponentMap[child.type]

    if (!component) {
      notifyUnknownNodeType(child.type)
      return null
    }

    return (
      <component {...restProps} parent={parent}>
        {() => children && renderChildren(children, child)}
      </component>
    )
  })
}
