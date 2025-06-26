import type { Component } from 'vue'
import type { BaseNode } from '../types'
import { isTableHeaderNode, isListNode, TableRowSection } from '../types'
import Blockquote from './nodes/Blockquote.vue'
import Code from './nodes/Code.vue'
import CodeBlock from './nodes/CodeBlock.vue'
import Emphasis from './nodes/Emphasis.vue'
import Heading from './nodes/Heading.vue'
import Image from './nodes/Image.vue'
import LineBreak from './nodes/LineBreak.vue'
import Strikethrough from './nodes/Strikethrough.vue'
import Table from './nodes/Table.vue'
import TableRow from './nodes/TableRow.vue'
import TableCell from './nodes/TableCell.vue'
import TaskCheckbox from './nodes/TaskCheckbox.vue'
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
  break: LineBreak,
  link: Link,
  list: List,
  list_item: ListItem,
  paragraph: Paragraph,
  strikethrough: Strikethrough,
  table: Table,
  table_header: TableRow,
  table_row: TableRow,
  table_cell: TableCell,
  task_checkbox: TaskCheckbox,
  text: Text,
  text_block: TextBlock,
}

const nodeTypesNotified: string[] = []
function notifyUnknownNodeType(type: string) {
  if (nodeTypesNotified.indexOf(type) !== -1) {
    return
  }

  nodeTypesNotified.push(type)
  console.warn(`[DocumentViewer] Unable to render an unknown node type "${type}"`)
}

export default function renderChildren<ChildTypes extends BaseNode>(children: ChildTypes[], parent?: BaseNode): Component {
  return children.map((child, index) => {
    if (!child) {
      return null
    }

    const { type, children, ...restProps } = child
    const component = nodeTypeToComponentMap[child.type]

    if (!component) {
      notifyUnknownNodeType(type)
      return null
    }

    if (isTableHeaderNode(child)) {
      // Need to tell the section that this is a header tag
      child.section = TableRowSection.header
    }

    if (isListNode(child)) {
      // Check if list items contain a task list item
      const containsTaskListItems = child.children?.some((listItem) => {
        return listItem.children?.some((itemContent) => {
          return itemContent.children?.some((content) => content.type === 'task_checkbox')
        })
      })

      return (
        <component hasTaskItems={containsTaskListItems} {...restProps} parent={parent}>
          {() => children && renderChildren(children, child)}
        </component>
      )
    }

    if (child?.type === 'code_block') {
      return (
        <component
          {...restProps}
          lines={children}
          isSingleLine={children?.length && children.length === 1}
          codeBlockIndex={index}
        />
      )
    }

    return (
      <component {...restProps} parent={parent}>
        {() => children && renderChildren(children, child)}
      </component>
    )
  })
}
