import type { DocumentTree } from '../src/types'

export const selectedDocResponse = {
  id: '8ddf155f-9e34-4cd6-8180-907b0dac2960',
  parent_document_id: null,
  title: 'CarolineCEO_API',
  slug: 'CarolineCEO_API',
  status: 'published',
  str_md_content: '# CarolineCEO_API\r\n\r\n## Description\r\nThis API is used to manage information about and communication to Caroline',
  ast: [
    {
      children: [
        {
          text: 'CarolineCEO_API',
          type: 'text',
        },
      ],
      level: 1,
      type: 'heading',
    },
    {
      children: [
        {
          text: 'Description',
          type: 'text',
        },
      ],
      level: 2,
      type: 'heading',
    },
    {
      children: [
        {
          text: 'This API is used to manage information about and communication to Caroline',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
  ],
  metadata: {},
  created_at: '2024-02-20T16:01:17.943053Z',
  updated_at: '2024-03-14T16:49:01.573634Z',
}

interface DocumentListItem {
  name: string
  id: string
  record: DocumentTree
  children?: DocumentListItem[]
  selected?: boolean
}

export const documentListResponse = {
  data: [
    {
      id: '8ddf155f-9e34-4cd6-8180-907b0dac2960',
      children: [],
      name: 'CarolineCEO_API',
      record: {
        children: [],
        id: '8ddf155f-9e34-4cd6-8180-907b0dac2960',
        metadata: {},
        parent_document_id: null,
        slug: 'CarolineCEO_API',
        status: 'published',
        title: 'CarolineCEO_API',
      },
      selected: true,
    },
  ] as DocumentListItem[],
  meta: {
    page: {
      number: 1,
      size: 1,
      total: 1,
    },
  },
}
