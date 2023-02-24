export const defaultDocument = {
  type: 'document',
  version: 1,
  children: [
    {
      type: 'heading',
      level: 1,
      children: [
        {
          type: 'text',
          text: 'JSON Structured Document Format example document',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          text: 'The JSON Structured Document defines a standard JSON object tree representation of structured documents that is language and technology agnostic. It is designed to be fully compatible with GitHub Flavored Markdown out of the box yet extensible for specific custom usage needs.',
        },
      ],
    },
    {
      type: 'heading',
      level: 2,
      children: [
        {
          type: 'text',
          text: '1. Headings',
        },
      ],
    },
    {
      type: 'heading',
      level: 1,
      children: [
        {
          type: 'text',
          text: 'First-level heading (h1)',
        },
      ],
    },
    {
      type: 'heading',
      level: 2,
      children: [
        {
          type: 'text',
          text: 'Second-level heading (h2)',
        },
      ],
    },
    {
      type: 'heading',
      level: 3,
      children: [
        {
          type: 'text',
          text: 'Third-level heading (h3)',
        },
      ],
    },
    {
      type: 'heading',
      level: 4,
      children: [
        {
          type: 'text',
          text: 'Fourth-level heading (h4)',
        },
      ],
    },
    {
      type: 'heading',
      level: 5,
      children: [
        {
          type: 'text',
          text: 'Fifth-level heading (h5)',
        },
      ],
    },
    {
      type: 'heading',
      level: 6,
      children: [
        {
          type: 'text',
          text: 'Sixth-level heading (h6)',
        },
      ],
    },
    {
      type: 'heading',
      level: 2,
      children: [
        {
          type: 'text',
          text: '2. Paragraphs',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          text: 'This is a paragraph',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          type: 'text',
          text: 'This is also a paragraph with extra characters © ® ™',
        },
      ],
    },
    {
      type: 'heading',
      level: 2,
      children: [
        {
          type: 'text',
          text: '3. Emphasis',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          type: 'emphasis',
          level: 1,
          children: [
            {
              type: 'text',
              text: 'This is a text with emphasis',
            },
          ],
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          type: 'emphasis',
          level: 2,
          children: [
            {
              type: 'text',
              text: 'This is a text with strong emphasis',
            },
          ],
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          type: 'emphasis',
          level: 1,
          children: [
            {
              type: 'emphasis',
              level: 2,
              children: [
                {
                  type: 'text',
                  text: 'This is a text with emphasis and strong emphasis combined',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'heading',
      level: 2,
      children: [
        {
          type: 'text',
          text: '4. Blockquotes',
        },
      ],
    },
    {
      type: 'blockquote',
      children: [
        {
          type: 'paragraph',
          children: [
            {
              type: 'text',
              text: 'I am a blockquote',
            },
          ],
        },
        {
          type: 'blockquote',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'I am a nested blockquote',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'heading',
      level: 2,
      children: [
        {
          type: 'text',
          text: '5. Lists',
        },
      ],
    },
    {
      type: 'list',
      is_ordered: false,
      children: [
        {
          type: 'list_item',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'I am a list item of an unordered list',
                },
              ],
            },
          ],
        },
        {
          type: 'list_item',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'I am another list item of an unordered list',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'list',
      is_ordered: true,
      children: [
        {
          type: 'list_item',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'I am a list item of an ordered list',
                },
              ],
            },
          ],
        },
        {
          type: 'list_item',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'I am another list item of an ordered list',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'list',
      is_ordered: true,
      children: [
        {
          type: 'list_item',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'I am a list item of an ordered list',
                },
              ],
            },
          ],
        },
        {
          type: 'list_item',
          children: [
            {
              type: 'paragraph',
              children: [
                {
                  type: 'text',
                  text: 'I am another list item',
                },
              ],
            },
            {
              type: 'list',
              is_ordered: false,
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'I am a nested list item',
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'heading',
      level: 2,
      children: [
        {
          type: 'text',
          text: '6. Code',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          type: 'code',
          children: [
            {
              type: 'text',
              text: 'I am an inline code fragment',
            },
          ],
        },
      ],
    },
    {
      type: 'code_block',
      children: [
        {
          type: 'text',
          text: 'I am a code block',
        },
      ],
    },
    {
      type: 'heading',
      level: 2,
      children: [
        {
          type: 'text',
          text: '7. Tables',
        },
      ],
    },
    {
      type: 'table',
      children: [
        {
          type: 'table_row',
          section: 'header',
          children: [
            {
              type: 'table_cell',
              children: [
                {
                  type: 'text',
                  text: 'Option 1',
                },
              ],
            },
            {
              type: 'table_cell',
              align: 'center',
              children: [
                {
                  type: 'text',
                  text: 'Option 2 - centered',
                },
              ],
            },
            {
              type: 'table_cell',
              align: 'right',
              children: [
                {
                  type: 'text',
                  text: 'Option 3 - right aligned',
                },
              ],
            },
          ],
        },
        {
          type: 'table_row',
          section: 'body',
          children: [
            {
              type: 'table_cell',
              children: [
                {
                  type: 'text',
                  text: 'Lorem ipsum dolor sit amet',
                },
              ],
            },
            {
              type: 'table_cell',
              align: 'center',
              children: [
                {
                  type: 'text',
                  text: 'Lorem ipsum dolor sit amet',
                },
              ],
            },
            {
              type: 'table_cell',
              align: 'right',
              children: [
                {
                  type: 'text',
                  text: 'Lorem ipsum dolor sit amet',
                },
              ],
            },
          ],
        },
      ],
    },
    {
      type: 'heading',
      level: 2,
      children: [
        {
          type: 'text',
          text: '8. Links',
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          type: 'link',
          href: '#',
          children: [
            {
              type: 'text',
              text: 'I am a link',
            },
          ],
        },
      ],
    },
    {
      type: 'paragraph',
      children: [
        {
          type: 'link',
          title: 'I am a title',
          href: '#',
          children: [
            {
              type: 'text',
              text: 'I am a link with title',
            },
          ],
        },
      ],
    },
    {
      type: 'heading',
      level: 2,
      children: [
        {
          type: 'text',
          text: '9. Images',
        },
      ],
    },
    {
      type: 'image',
      url: 'https://avatars.githubusercontent.com/u/962416',
      alt: 'Kong Inc. logo',
      children: [
        {
          type: 'text',
          text: 'Kong Inc. Github profile picture',
        },
      ],
    },
  ],
}
