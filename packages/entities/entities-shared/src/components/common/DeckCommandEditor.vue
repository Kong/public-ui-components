<template>
  <div class="deck-command-editor-wrapper">
    <MonacoEditor
      v-model="code"
      appearance="standalone"
      class="deck-command-editor"
      :language="language"
      :options="monacoOptions"
      theme="light"
    />
    <div class="deck-command-copy-button">
      <KCodeBlockIconButton
        :aria-label="t('deckCodeBlock.copy_tooltip')"
        :copy-tooltip="t('deckCodeBlock.copy_tooltip')"
        theme="light"
        @click="copyDeckCommand()"
      >
        <CopyIcon decorative />
      </KCodeBlockIconButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MonacoEditor } from '@kong-ui-public/monaco-editor'
import { CopyIcon } from '@kong/icons'
import { KCodeBlockIconButton } from '@kong/kongponents'

import '@kong-ui-public/monaco-editor/dist/runtime/style.css'

import composables from '../../composables'

import type * as monaco from 'monaco-editor'

defineProps<{
  language: 'bash' | 'powershell'
}>()

const code = defineModel<string>({ required: true })

const { i18n: { t } } = composables.useI18n()

const monacoOptions = {
  scrollbar: {
    alwaysConsumeMouseWheel: false,
  },
  autoIndent: 'keep',
  editContext: false,
} as const satisfies Partial<monaco.editor.IStandaloneEditorConstructionOptions>

/**
 * Borrowed from {@link https://github.com/Kong/kongponents/blob/5d82c77d767a35f08a37c27ffcd6ae11c97fe91d/src/components/KCodeBlock/KCodeBlock.vue}
 */
async function copyDeckCommand() {
  await copyTextToClipboard(code.value)
}

/**
 * Borrowed from {@link https://github.com/Kong/kongponents/blob/5d82c77d767a35f08a37c27ffcd6ae11c97fe91d/src/utilities/copyTextToClipboard.ts}
 *
 * Not importing directly as it was not formally exported from @kong/kongponents.
 */
async function copyTextToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch {
      // Do nothing and let the remaining logic try to be successful.
    }
  }

  const textArea = document?.createElement('textarea')

  if (textArea) {
    textArea.style.position = 'fixed'
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.width = '32px'
    textArea.style.height = '32px'
    textArea.style.padding = '0'
    textArea.style.border = 'none'
    textArea.style.outline = 'none'
    textArea.style.boxShadow = 'none'
    textArea.style.background = 'transparent'

    textArea.value = text

    document?.body?.appendChild(textArea)
    textArea.focus()
    textArea.select()
  }

  let isSuccess: boolean

  try {
    isSuccess = document?.execCommand('copy')
  } catch {
    isSuccess = false
  } finally {
    document?.body?.removeChild(textArea)
  }

  return isSuccess
}
</script>

<style lang="scss" scoped>
.deck-command-editor-wrapper {
  position: relative;

  .deck-command-editor {
    height: 300px;
    margin-top: var(--kui-space-50, $kui-space-50);
    width: 100%;
  }

  .deck-command-copy-button {
    opacity: 0;
    position: absolute;
    right: 10px;
    top: 10px;
    transition: opacity linear var(--kui-animation-duration-20, $kui-animation-duration-20);
  }

  &:hover .deck-command-copy-button {
    opacity: 1;
  }
}
</style>
