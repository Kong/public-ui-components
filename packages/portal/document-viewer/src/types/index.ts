/* eslint-disable no-unused-vars */
export interface BaseNode<Type extends string = string> {
  type: Type
  children?: Array<BaseNode>
}

// TODO: Reach out to DevX for a proper interface
export interface Document extends BaseNode<'document'> {
  children: Array<BaseNode>
  version: number
}

export enum TableRowSection {
  header = 'header',
  body = 'body',
  footer = 'footer'
}

export enum TableCellAlign {
  left = 'left',
  center = 'center',
  right = 'right'
}

export interface TableCellNode extends BaseNode<'table_cell'> {
  align?: TableCellAlign
}

export interface TableRowNode extends BaseNode<'table_row'> {
  section?: TableRowSection
  children: Array<TableCellNode>
}

export interface TextNode extends BaseNode<'text'> {
  text: string
  children: undefined
  appendSpace?: boolean
}

export function isTextNode(o: any): o is TextNode {
  return !!(o?.type === 'text')
}

export interface HeadingNode extends BaseNode<'heading'> {
  level: number
}

export function isHeadingNode(o: any): o is HeadingNode {
  return !!(o?.type === 'heading')
}

export interface ListItemNode extends BaseNode<'list_item'> {}

export interface ListNode extends BaseNode<'list'> {
  isOrdered?: boolean
  children: Array<ListItemNode>
}

export interface LinkNode extends BaseNode<'link'> {
  href: string
}
