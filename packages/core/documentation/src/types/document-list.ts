export interface DocumentTree {
  id: string
  parent_document_id?: string | null
  title: string
  slug: string
  metadata: Record<string, any>
  status?: 'published' | 'unpublished'
  children: DocumentTree[]
  revision?: {
    document_id: string
    file: {
      filename: string
      modified_at: string
    }
    id: string
    metadata: Record<string, any>
    raw_md_content: string
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
