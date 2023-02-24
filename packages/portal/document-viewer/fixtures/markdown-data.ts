export const defaultDocument = {
  children: [
    {
      children: [
        {
          text: 'Markdown: Syntax',
          type: 'text',
        },
      ],
      level: 1,
      type: 'heading',
    },
    {
      children: [
        {
          text: 'Overview',
          type: 'text',
        },
      ],
      level: 2,
      type: 'heading',
    },
    {
      children: [
        {
          text: 'Philosophy',
          type: 'text',
        },
      ],
      level: 3,
      type: 'heading',
    },
    {
      children: [
        {
          text: 'Markdown is intended to be as easy-to-read and easy-to-write as is feasible.',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          hardBreak: true,
          text: 'Readability, however, is emphasized above all else. A Markdown-formatted',
          type: 'text',
        },
        {
          text: 'document should be publishable as-is, as plain text, without looking',
          type: 'text',
        },
        {
          text: "like it's been marked up with tags or formatting instructions. While",
          type: 'text',
        },
        {
          text: "Markdown's syntax has been influenced by several existing text-to-HTML",
          type: 'text',
        },
        {
          text: 'filters -- including ',
          type: 'text',
        },
        {
          children: [
            {
              text: 'Setext',
              type: 'text',
            },
          ],
          href: 'http://docutils.sourceforge.net/mirror/setext.html',
          title: '',
          type: 'link',
        },
        {
          text: ', ',
          type: 'text',
        },
        {
          children: [
            {
              text: 'atx',
              type: 'text',
            },
          ],
          href: 'http://www.aaronsw.com/2002/atx/',
          title: '',
          type: 'link',
        },
        {
          text: ', ',
          type: 'text',
        },
        {
          children: [
            {
              text: 'Textile',
              type: 'text',
            },
          ],
          href: 'http://textism.com/tools/textile/',
          title: '',
          type: 'link',
        },
        {
          text: ', ',
          type: 'text',
        },
        {
          children: [
            {
              text: 'reStructuredText',
              type: 'text',
            },
          ],
          href: 'http://docutils.sourceforge.net/rst.html',
          title: '',
          type: 'link',
        },
        {
          text: ',',
          type: 'text',
        },
        {
          children: [
            {
              text: 'Grutatext',
              type: 'text',
            },
          ],
          href: 'http://www.triptico.com/software/grutatxt.html',
          title: '',
          type: 'link',
        },
        {
          text: ', and ',
          type: 'text',
        },
        {
          children: [
            {
              text: 'EtText',
              type: 'text',
            },
          ],
          href: 'http://ettext.taint.org/doc/',
          title: '',
          type: 'link',
        },
        {
          text: ' -- the single biggest source of',
          type: 'text',
        },
        {
          text: "inspiration for Markdown's syntax is the format of plain text email.",
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'Block Elements',
          type: 'text',
        },
      ],
      level: 2,
      type: 'heading',
    },
    {
      children: [
        {
          text: 'Paragraphs and Line Breaks',
          type: 'text',
        },
      ],
      level: 3,
      type: 'heading',
    },
    {
      children: [
        {
          text: 'A paragraph is simply one or more consecutive lines of text, separated',
          type: 'text',
        },
        {
          text: 'by one or more blank lines. (A blank line is any line that looks like a',
          type: 'text',
        },
        {
          text: 'blank line -- a line containing nothing but spaces or tabs is considered',
          type: 'text',
        },
        {
          text: 'blank.) Normal paragraphs should not be indented with spaces or tabs.',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'The implication of the "one or more consecutive lines of text" rule is',
          type: 'text',
        },
        {
          text: 'that Markdown supports "hard-wrapped" text paragraphs. This differs',
          type: 'text',
        },
        {
          text: 'significantly from most other text-to-HTML formatters (including Movable',
          type: 'text',
        },
        {
          text: "Type's \"Convert Line Breaks\" option) which translate every line break",
          type: 'text',
        },
        {
          text: 'character in a paragraph into a ',
          type: 'text',
        },
        {
          children: [
            {
              text: '<br />',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ' tag.',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'When you ',
          type: 'text',
        },
        {
          children: [
            {
              text: 'do',
              type: 'text',
            },
          ],
          level: 1,
          type: 'emphasis',
        },
        {
          text: ' want to insert a ',
          type: 'text',
        },
        {
          children: [
            {
              text: '<br />',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ' break tag using Markdown, you',
          type: 'text',
        },
        {
          text: 'end a line with two or more spaces, then type return.',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'Headers',
          type: 'text',
        },
      ],
      level: 3,
      type: 'heading',
    },
    {
      children: [
        {
          text: 'Markdown supports two styles of headers, [',
          type: 'text',
        },
        {
          text: 'Setext] [',
          type: 'text',
        },
        {
          text: '1] and [',
          type: 'text',
        },
        {
          text: 'atx] [',
          type: 'text',
        },
        {
          text: '2',
          type: 'text',
        },
        {
          text: '].',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'Optionally, you may "close" atx-style headers. This is purely',
          type: 'text',
        },
        {
          text: 'cosmetic -- you can use this if you think it looks better. The',
          type: 'text',
        },
        {
          text: "closing hashes don't even need to match the number of hashes",
          type: 'text',
        },
        {
          text: 'used to open the header. (The number of opening hashes',
          type: 'text',
        },
        {
          text: 'determines the header level.)',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'Blockquotes',
          type: 'text',
        },
      ],
      level: 3,
      type: 'heading',
    },
    {
      children: [
        {
          text: 'Markdown uses email-style ',
          type: 'text',
        },
        {
          children: [
            {
              text: '>',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: " characters for blockquoting. If you're",
          type: 'text',
        },
        {
          text: 'familiar with quoting passages of text in an email message, then you',
          type: 'text',
        },
        {
          text: 'know how to create a blockquote in Markdown. It looks best if you hard',
          type: 'text',
        },
        {
          text: 'wrap the text and put a ',
          type: 'text',
        },
        {
          children: [
            {
              text: '>',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ' before every line:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              text: 'This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,',
              type: 'text',
            },
            {
              text: 'consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.',
              type: 'text',
            },
            {
              text: 'Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.',
              type: 'text',
            },
          ],
          type: 'paragraph',
        },
        {
          children: [
            {
              text: 'Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse',
              type: 'text',
            },
            {
              text: 'id sem consectetuer libero luctus adipiscing.',
              type: 'text',
            },
          ],
          type: 'paragraph',
        },
      ],
      type: 'blockquote',
    },
    {
      children: [
        {
          text: 'Markdown allows you to be lazy and only put the ',
          type: 'text',
        },
        {
          children: [
            {
              text: '>',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ' before the first',
          type: 'text',
        },
        {
          text: 'line of a hard-wrapped paragraph:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              text: 'This is a blockquote with two paragraphs. Lorem ipsum dolor sit amet,',
              type: 'text',
            },
            {
              text: 'consectetuer adipiscing elit. Aliquam hendrerit mi posuere lectus.',
              type: 'text',
            },
            {
              text: 'Vestibulum enim wisi, viverra nec, fringilla in, laoreet vitae, risus.',
              type: 'text',
            },
          ],
          type: 'paragraph',
        },
      ],
      type: 'blockquote',
    },
    {
      children: [
        {
          children: [
            {
              text: 'Donec sit amet nisl. Aliquam semper ipsum sit amet velit. Suspendisse',
              type: 'text',
            },
            {
              text: 'id sem consectetuer libero luctus adipiscing.',
              type: 'text',
            },
          ],
          type: 'paragraph',
        },
      ],
      type: 'blockquote',
    },
    {
      children: [
        {
          text: 'Blockquotes can be nested (i.e. a blockquote-in-a-blockquote) by',
          type: 'text',
        },
        {
          text: 'adding additional levels of ',
          type: 'text',
        },
        {
          children: [
            {
              text: '>',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ':',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              text: 'This is the first level of quoting.',
              type: 'text',
            },
          ],
          type: 'paragraph',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'This is nested blockquote.',
                  type: 'text',
                },
              ],
              type: 'paragraph',
            },
          ],
          type: 'blockquote',
        },
        {
          children: [
            {
              text: 'Back to the first level.',
              type: 'text',
            },
          ],
          type: 'paragraph',
        },
      ],
      type: 'blockquote',
    },
    {
      children: [
        {
          text: 'Blockquotes can contain other Markdown elements, including headers, lists,',
          type: 'text',
        },
        {
          text: 'and code blocks:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              text: 'This is a header.',
              type: 'text',
            },
          ],
          level: 2,
          type: 'heading',
        },
        {
          children: [
            {
              children: [
                {
                  children: [
                    {
                      text: 'This is the first list item.',
                      type: 'text',
                    },
                  ],
                  type: 'text_block',
                },
              ],
              type: 'list_item',
            },
            {
              children: [
                {
                  children: [
                    {
                      text: 'This is the second list item.',
                      type: 'text',
                    },
                  ],
                  type: 'text_block',
                },
              ],
              type: 'list_item',
            },
          ],
          isOrdered: true,
          type: 'list',
        },
        {
          children: [
            {
              text: "Here's some example code:",
              type: 'text',
            },
          ],
          type: 'paragraph',
        },
        {
          children: [
            {
              text: 'return shell_exec("echo $input | $markdown_script");\n',
              type: 'text',
            },
          ],
          lang: 'plain',
          type: 'code_block',
        },
      ],
      type: 'blockquote',
    },
    {
      children: [
        {
          text: 'Any decent text editor should make email-style quoting easy. For',
          type: 'text',
        },
        {
          text: 'example, with BBEdit, you can make a selection and choose Increase',
          type: 'text',
        },
        {
          text: 'Quote Level from the Text menu.',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'Lists',
          type: 'text',
        },
      ],
      level: 3,
      type: 'heading',
    },
    {
      children: [
        {
          text: 'Markdown supports ordered (numbered) and unordered (bulleted) lists.',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'Unordered lists use asterisks, pluses, and hyphens -- interchangably',
          type: 'text',
        },
        {
          text: '-- as list markers:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              children: [
                {
                  text: 'Red',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'Green',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'Blue',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
      ],
      isOrdered: false,
      type: 'list',
    },
    {
      children: [
        {
          text: 'is equivalent to:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              children: [
                {
                  text: 'Red',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'Green',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'Blue',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
      ],
      isOrdered: false,
      type: 'list',
    },
    {
      children: [
        {
          text: 'and:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              children: [
                {
                  text: 'Red',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'Green',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'Blue',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
      ],
      isOrdered: false,
      type: 'list',
    },
    {
      children: [
        {
          text: 'Ordered lists use numbers followed by periods:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              children: [
                {
                  text: 'Bird',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'McHale',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'Parish',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
      ],
      isOrdered: true,
      type: 'list',
    },
    {
      children: [
        {
          text: "It's important to note that the actual numbers you use to mark the",
          type: 'text',
        },
        {
          text: 'list have no effect on the HTML output Markdown produces. The HTML',
          type: 'text',
        },
        {
          text: 'Markdown produces from the above list is:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'If you instead wrote the list in Markdown like this:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              children: [
                {
                  text: 'Bird',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'McHale',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'Parish',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
      ],
      isOrdered: true,
      type: 'list',
    },
    {
      children: [
        {
          text: 'or even:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              children: [
                {
                  text: 'Bird',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'McHale',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'Parish',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
      ],
      isOrdered: true,
      type: 'list',
    },
    {
      children: [
        {
          text: "you'd get the exact same HTML output. The point is, if you want to,",
          type: 'text',
        },
        {
          text: 'you can use ordinal numbers in your ordered Markdown lists, so that',
          type: 'text',
        },
        {
          text: 'the numbers in your source match the numbers in your published HTML.',
          type: 'text',
        },
        {
          text: "But if you want to be lazy, you don't have to.",
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'To make lists look nice, you can wrap items with hanging indents:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              children: [
                {
                  text: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
                  type: 'text',
                },
                {
                  text: 'Aliquam hendrerit mi posuere lectus. Vestibulum enim wisi,',
                  type: 'text',
                },
                {
                  text: 'viverra nec, fringilla in, laoreet vitae, risus.',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'Donec sit amet nisl. Aliquam semper ipsum sit amet velit.',
                  type: 'text',
                },
                {
                  text: 'Suspendisse id sem consectetuer libero luctus adipiscing.',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
      ],
      isOrdered: false,
      type: 'list',
    },
    {
      children: [
        {
          text: "But if you want to be lazy, you don't have to:",
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              children: [
                {
                  text: 'Lorem ipsum dolor sit amet, consectetuer adipiscing elit.',
                  type: 'text',
                },
                {
                  text: 'Aliquam hendrerit mi posuere lectus. Vestibulum enim wisi,',
                  type: 'text',
                },
                {
                  text: 'viverra nec, fringilla in, laoreet vitae, risus.',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'Donec sit amet nisl. Aliquam semper ipsum sit amet velit.',
                  type: 'text',
                },
                {
                  text: 'Suspendisse id sem consectetuer libero luctus adipiscing.',
                  type: 'text',
                },
              ],
              type: 'text_block',
            },
          ],
          type: 'list_item',
        },
      ],
      isOrdered: false,
      type: 'list',
    },
    {
      children: [
        {
          text: 'List items may consist of multiple paragraphs. Each subsequent',
          type: 'text',
        },
        {
          text: 'paragraph in a list item must be indented by either 4 spaces',
          type: 'text',
        },
        {
          text: 'or one tab:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              children: [
                {
                  text: 'This is a list item with two paragraphs. Lorem ipsum dolor',
                  type: 'text',
                },
                {
                  text: 'sit amet, consectetuer adipiscing elit. Aliquam hendrerit',
                  type: 'text',
                },
                {
                  text: 'mi posuere lectus.',
                  type: 'text',
                },
              ],
              type: 'paragraph',
            },
            {
              children: [
                {
                  text: 'Vestibulum enim wisi, viverra nec, fringilla in, laoreet',
                  type: 'text',
                },
                {
                  text: 'vitae, risus. Donec sit amet nisl. Aliquam semper ipsum',
                  type: 'text',
                },
                {
                  text: 'sit amet velit.',
                  type: 'text',
                },
              ],
              type: 'paragraph',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'Suspendisse id sem consectetuer libero luctus adipiscing.',
                  type: 'text',
                },
              ],
              type: 'paragraph',
            },
          ],
          type: 'list_item',
        },
      ],
      isOrdered: true,
      type: 'list',
    },
    {
      children: [
        {
          text: 'It looks nice if you indent every line of the subsequent',
          type: 'text',
        },
        {
          text: 'paragraphs, but here again, Markdown will allow you to be',
          type: 'text',
        },
        {
          text: 'lazy:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              children: [
                {
                  text: 'This is a list item with two paragraphs.',
                  type: 'text',
                },
              ],
              type: 'paragraph',
            },
            {
              children: [
                {
                  text: "This is the second paragraph in the list item. You're",
                  type: 'text',
                },
                {
                  text: 'only required to indent the first line. Lorem ipsum dolor',
                  type: 'text',
                },
                {
                  text: 'sit amet, consectetuer adipiscing elit.',
                  type: 'text',
                },
              ],
              type: 'paragraph',
            },
          ],
          type: 'list_item',
        },
        {
          children: [
            {
              children: [
                {
                  text: 'Another item in the same list.',
                  type: 'text',
                },
              ],
              type: 'paragraph',
            },
          ],
          type: 'list_item',
        },
      ],
      isOrdered: false,
      type: 'list',
    },
    {
      children: [
        {
          text: "To put a blockquote within a list item, the blockquote's ",
          type: 'text',
        },
        {
          children: [
            {
              text: '>',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: '',
          type: 'text',
        },
        {
          text: 'delimiters need to be indented:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              children: [
                {
                  text: 'A list item with a blockquote:',
                  type: 'text',
                },
              ],
              type: 'paragraph',
            },
            {
              children: [
                {
                  children: [
                    {
                      text: 'This is a blockquote',
                      type: 'text',
                    },
                    {
                      text: 'inside a list item.',
                      type: 'text',
                    },
                  ],
                  type: 'paragraph',
                },
              ],
              type: 'blockquote',
            },
          ],
          type: 'list_item',
        },
      ],
      isOrdered: false,
      type: 'list',
    },
    {
      children: [
        {
          text: 'To put a code block within a list item, the code block needs',
          type: 'text',
        },
        {
          text: 'to be indented ',
          type: 'text',
        },
        {
          children: [
            {
              text: 'twice',
              type: 'text',
            },
          ],
          level: 1,
          type: 'emphasis',
        },
        {
          text: ' -- 8 spaces or two tabs:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              children: [
                {
                  text: 'A list item with a code block:',
                  type: 'text',
                },
              ],
              type: 'paragraph',
            },
            {
              children: [
                {
                  text: '<code goes here>\n',
                  type: 'text',
                },
              ],
              lang: 'html',
              type: 'code_block',
            },
          ],
          type: 'list_item',
        },
      ],
      isOrdered: false,
      type: 'list',
    },
    {
      children: [
        {
          text: 'Code Blocks',
          type: 'text',
        },
      ],
      level: 3,
      type: 'heading',
    },
    {
      children: [
        {
          text: 'Pre-formatted code blocks are used for writing about programming or',
          type: 'text',
        },
        {
          text: 'markup source code. Rather than forming normal paragraphs, the lines',
          type: 'text',
        },
        {
          text: 'of a code block are interpreted literally. Markdown wraps a code block',
          type: 'text',
        },
        {
          text: 'in both ',
          type: 'text',
        },
        {
          children: [
            {
              text: '<pre>',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ' and ',
          type: 'text',
        },
        {
          children: [
            {
              text: '<code>',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ' tags.',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'To produce a code block in Markdown, simply indent every line of the',
          type: 'text',
        },
        {
          text: 'block by at least 4 spaces or 1 tab.',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'This is a normal paragraph:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'This is a code block.\n',
          type: 'text',
        },
      ],
      lang: 'plain',
      type: 'code_block',
    },
    {
      children: [
        {
          text: 'Here is an example of AppleScript:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'tell application "Foo"\n',
          type: 'text',
        },
        {
          text: '    beep\n',
          type: 'text',
        },
        {
          text: 'end tell\n',
          type: 'text',
        },
      ],
      lang: 'applescript',
      type: 'code_block',
    },
    {
      children: [
        {
          text: 'A code block continues until it reaches a line that is not indented',
          type: 'text',
        },
        {
          text: '(or the end of the article).',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'Within a code block, ampersands (',
          type: 'text',
        },
        {
          children: [
            {
              text: '&',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ') and angle brackets (',
          type: 'text',
        },
        {
          children: [
            {
              text: '<',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ' and ',
          type: 'text',
        },
        {
          children: [
            {
              text: '>',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ')',
          type: 'text',
        },
        {
          text: 'are automatically converted into HTML entities. This makes it very',
          type: 'text',
        },
        {
          text: 'easy to include example HTML source code using Markdown -- just paste',
          type: 'text',
        },
        {
          text: 'it and indent it, and Markdown will handle the hassle of encoding the',
          type: 'text',
        },
        {
          text: 'ampersands and angle brackets. For example, this:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: '<div class="footer">\n',
          type: 'text',
        },
        {
          text: '    &copy; 2004 Foo Corporation\n',
          type: 'text',
        },
        {
          text: '</div>\n',
          type: 'text',
        },
      ],
      lang: 'html',
      type: 'code_block',
    },
    {
      children: [
        {
          text: 'Regular Markdown syntax is not processed within code blocks. E.g.,',
          type: 'text',
        },
        {
          text: 'asterisks are just literal asterisks within a code block. This means',
          type: 'text',
        },
        {
          text: "it's also easy to use Markdown to write about Markdown's own syntax.",
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'tell application "Foo"\n',
          type: 'text',
        },
        {
          text: '    beep\n',
          type: 'text',
        },
        {
          text: 'end tell\n',
          type: 'text',
        },
      ],
      lang: 'python',
      type: 'code_block',
    },
    {
      children: [
        {
          text: 'Span Elements',
          type: 'text',
        },
      ],
      level: 2,
      type: 'heading',
    },
    {
      children: [
        {
          text: 'Links',
          type: 'text',
        },
      ],
      level: 3,
      type: 'heading',
    },
    {
      children: [
        {
          text: 'Markdown supports two style of links: ',
          type: 'text',
        },
        {
          children: [
            {
              text: 'inline',
              type: 'text',
            },
          ],
          level: 1,
          type: 'emphasis',
        },
        {
          text: ' and ',
          type: 'text',
        },
        {
          children: [
            {
              text: 'reference',
              type: 'text',
            },
          ],
          level: 1,
          type: 'emphasis',
        },
        {
          text: '.',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'In both styles, the link text is delimited by [',
          type: 'text',
        },
        {
          text: 'square brackets',
          type: 'text',
        },
        {
          text: '].',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'To create an inline link, use a set of regular parentheses immediately',
          type: 'text',
        },
        {
          text: "after the link text's closing square bracket. Inside the parentheses,",
          type: 'text',
        },
        {
          text: 'put the URL where you want the link to point, along with an ',
          type: 'text',
        },
        {
          children: [
            {
              text: 'optional',
              type: 'text',
            },
          ],
          level: 1,
          type: 'emphasis',
        },
        {
          text: '',
          type: 'text',
        },
        {
          text: 'title for the link, surrounded in quotes. For example:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'This is ',
          type: 'text',
        },
        {
          children: [
            {
              text: 'an example',
              type: 'text',
            },
          ],
          href: 'http://example.com/',
          title: '',
          type: 'link',
        },
        {
          text: ' inline link.',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              text: 'This link',
              type: 'text',
            },
          ],
          href: 'http://example.net/',
          title: '',
          type: 'link',
        },
        {
          text: ' has no title attribute.',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'Emphasis',
          type: 'text',
        },
      ],
      level: 3,
      type: 'heading',
    },
    {
      children: [
        {
          text: 'Markdown treats asterisks (',
          type: 'text',
        },
        {
          children: [
            {
              text: '*',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ') and underscores (',
          type: 'text',
        },
        {
          children: [
            {
              text: '_',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ') as indicators of',
          type: 'text',
        },
        {
          text: 'emphasis. Text wrapped with one ',
          type: 'text',
        },
        {
          children: [
            {
              text: '*',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ' or ',
          type: 'text',
        },
        {
          children: [
            {
              text: '_',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ' will be wrapped with an',
          type: 'text',
        },
        {
          text: 'HTML ',
          type: 'text',
        },
        {
          children: [
            {
              text: '<em>',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ' tag; double ',
          type: 'text',
        },
        {
          children: [
            {
              text: '*',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: "'s or ",
          type: 'text',
        },
        {
          children: [
            {
              text: '_',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: "'s will be wrapped with an HTML",
          type: 'text',
        },
        {
          children: [
            {
              text: '<strong>',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ' tag. E.g., this input:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              text: 'single asterisks',
              type: 'text',
            },
          ],
          level: 1,
          type: 'emphasis',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              text: 'single underscores',
              type: 'text',
            },
          ],
          level: 1,
          type: 'emphasis',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              text: 'double asterisks',
              type: 'text',
            },
          ],
          level: 2,
          type: 'emphasis',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          children: [
            {
              text: 'double underscores',
              type: 'text',
            },
          ],
          level: 2,
          type: 'emphasis',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'Code',
          type: 'text',
        },
      ],
      level: 3,
      type: 'heading',
    },
    {
      children: [
        {
          text: 'To indicate a span of code, wrap it with backtick quotes (',
          type: 'text',
        },
        {
          children: [
            {
              text: '`',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ').',
          type: 'text',
        },
        {
          text: 'Unlike a pre-formatted code block, a code span indicates code within a',
          type: 'text',
        },
        {
          text: 'normal paragraph. For example:',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
    {
      children: [
        {
          text: 'Use the ',
          type: 'text',
        },
        {
          children: [
            {
              text: 'printf()',
              type: 'text',
            },
          ],
          type: 'code',
        },
        {
          text: ' function.',
          type: 'text',
        },
      ],
      type: 'paragraph',
    },
  ],
  type: 'document',
  version: '1',
}
