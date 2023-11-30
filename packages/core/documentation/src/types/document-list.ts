export interface DocumentTree {
  id: string
  parent_document_id?: string | null
  title: string
  slug: string
  metadata: object
  status?: 'published' | 'unpublished'
  children: Array<DocumentTree>
  revision?: {
    document_id: string
    file: {
      filename: string
      modified_at: string
    },
    id: string
    metadata: Object,
    raw_md_content: string,
    title: string
  }
}

export interface DocumentListItem {
  name: string
  id: string
  record: DocumentTree
  children?: DocumentListItem[]
  selected?: boolean
}
