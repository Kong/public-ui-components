<template>
  <KCodeBlock
    :id="codeBlockKey"
    class="document-code-block"
    :code="stringifiedCode"
    :is-processing="isProcessing"
    :is-single-line="isSingleLine"
    :language="lang"
    theme="light"
    @code-block-render="highlight"
  />
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { TextNode } from '../../types'
import * as components from 'prismjs/components'
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

const supportedPrismLanguages = Object.keys(components.languages)
  // @ts-ignore
  .reduce((arr, lang) => {
    const alias = components.languages[lang].alias || []

    return [...arr, lang, ...(Array.isArray(alias) ? alias : [alias])]
  }, [])
  // @ts-ignore
  .sort()

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

watch(() => props.lang, async (language: string) => {
  if (supportedPrismLanguages.includes(language)) {
    try {
      await import(/* @vite-ignore */`../../../node_modules/prismjs/components/prism-${language}.min.js`)
    } catch (e) {
      console.warn(`Prism does not have a language file for '${language}'`)
    }
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
  margin-bottom: var(--spacing-sm, 12px);
}
</style>
