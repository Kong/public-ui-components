<template>
  <KCodeBlock
    :id="codeBlockKey"
    class="document-code-block"
    :code="stringifiedCode"
    :language="lang"
    :processing="isProcessing"
    :single-line="isSingleLine"
    theme="light"
    @code-block-render="highlight"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import type { TextNode } from '../../types'
import Prism from 'prismjs'
import 'prismjs/themes/prism.min.css'

Prism.manual = true

const props = defineProps({
  codeBlockIndex: {
    type: Number,
    default: 1,
  },
  lines: {
    type: Array<TextNode>,
    required: true,
  },
  lang: {
    type: String,
    default: 'plaintext',
  },
  isSingleLine: {
    type: Boolean,
    default: false,
  },
})

const isProcessing = ref(false)

/**
 * Applies PrismJS syntax highlighting.
 *
 * **Note**: Use higher-level functions like `Prism.highlightElement` for highlighting.
 * Lower-level functions like `Prism.highlight` don’t run any of the hooks
 * that are used to make plugins work.
 */
function highlight(obj: any) {
  isProcessing.value = true

  if (!Prism.languages[obj.language]) {
    console.warn(`Prism: the language “${obj.language}” isn’t enabled.`)
  }

  if (!obj.preElement.classList.contains(`language-${obj.language}`)) {
    // Adds the language-* class which tells Prism which language to highlight for.
    obj.preElement.classList.add(`language-${obj.language}`)
  }

  // Ensures Prism operates on the raw code and not on an already highlighted DOM fragment.
  obj.codeElement.innerHTML = escapeUnsafeCharacters(obj.code)

  Prism.highlightElement(obj.codeElement)

  isProcessing.value = false
}

const escapeUnsafeCharacters = (unescapedCodeString: string): string => {
  return unescapedCodeString.replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;')
}

// Should be used in the case there's multiple code blocks
// in a markdown file.
const codeBlockKey = computed(() => `document-code-block-${props.codeBlockIndex}`)

const stringifiedCode = computed(() => {
  const code = props.lines?.flatMap(line => line.text)?.join('') || ''

  // To remove an extra line at the end, in the case that
  // someone leaves that in their markdown.
  if (code.endsWith('\n') && !props.isSingleLine) {
    return code.slice(0, -1)
  }

  return code
})

watch(() => props.lang, async () => {
  try {
    // Import a list of allowed languages
    await Promise.all([
      import('prismjs/components/prism-bash.min.js'),
      import('prismjs/components/prism-css.min.js'),
      import('prismjs/components/prism-docker.min.js'),
      import('prismjs/components/prism-go.min.js'),
      import('prismjs/components/prism-http.min.js'),
      import('prismjs/components/prism-javascript.min.js'),
      import('prismjs/components/prism-jq.min.js'),
      import('prismjs/components/prism-json.min.js'),
      import('prismjs/components/prism-log.min.js'),
      import('prismjs/components/prism-lua.min.js'),
      import('prismjs/components/prism-makefile.min.js'),
      import('prismjs/components/prism-markdown.min.js'),
      import('prismjs/components/prism-python.min.js'),
      import('prismjs/components/prism-regex.min.js'),
      import('prismjs/components/prism-rust.min.js'),
      import('prismjs/components/prism-rest.min.js'),
      import('prismjs/components/prism-scss.min.js'),
      import('prismjs/components/prism-sql.min.js'),
      import('prismjs/components/prism-typescript.min.js'),
      import('prismjs/components/prism-yaml.min.js'),
      import('prismjs/components/prism-xml-doc.min.js'),
    ])
  } catch {
    console.warn('Could not import PrismJS language file.')
  }
  Prism.highlightAll()
}, { immediate: true })

</script>

<style lang="scss" scoped>
.document-code-block {
  :deep(.k-highlighted-code-block) {
    &.is-single-line {
      box-sizing: border-box;
    }
  }
  margin-bottom: var(--kui-space-50, $kui-space-50);
}
</style>
