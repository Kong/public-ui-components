export interface DocumentTree {
  id: string
  parent_document_id?: string | null
  title: string
  slug: string
  metadata: object
  status?: 'published' | 'unpublished'
  children: Array<DocumentTree>
}

export interface DocumentListItem {
  name: string
  id: string
  record: DocumentTree
  children?: DocumentListItem[]
  selected?: boolean
}
