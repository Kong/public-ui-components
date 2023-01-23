export interface BaseNode<Type extends string = string> {
  type: Type
  children?: Array<BaseNode>
}

export interface Document extends BaseNode<'document'> {
  children: Array<BaseNode>
  version: number
}
