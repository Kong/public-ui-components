<template>
  <KModal
    action-button-text="Import"
    class="import-requests-modal"
    text-align="left"
    :title="i18n.t('requestImport.title')"
    :visible="visible"
    @cancel="emit('dismiss', false)"
    @proceed="handleProceed"
  >
    <KAlert appearance="warning">
      <i18n-t
        keypath="requestImport.warning"
        tag="p"
      >
        <template #boldText>
          <strong>{{ i18n.t('requestImport.warningBoldText') }}</strong>
        </template>
      </i18n-t>
    </KAlert>

    <MonacoEditor
      :key="activeColorMode"
      ref="editors"
      v-model="json"
      appearance="standalone"
      class="json-editor"
      data-testid="import-requests-editor"
      language="json"
      :options="options"
      :show-empty-state="false"
      :show-loading-state="false"
      :theme="activeColorMode"
    />

    <KAlert
      v-if="errorMessage"
      appearance="danger"
      :message="errorMessage"
    />
  </KModal>
</template>

<script setup lang="ts">
import { computed, inject, ref } from 'vue'
import { transformCheckRequest } from '../utils'
import { MonacoEditor } from '@kong-ui-public/monaco-editor'
import type { Request } from '../definitions'
import type * as Monaco from 'monaco-editor'
import composables from '../composables'
import type { ComputedRef } from 'vue'

import '@kong-ui-public/monaco-editor/dist/runtime/style.css'

const activeColorMode = inject<ComputedRef<'light' | 'dark'>>('app:konnectColorMode', computed(() => 'light'))

const { i18n, i18nT } = composables.useI18n()

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  dismiss: [completed: boolean]
  import: [requests: Request[]]
}>()

const json = ref('')
const errorMessage = ref<string | undefined>(undefined)

const options: Monaco.editor.IEditorOptions = {
  automaticLayout: true,
  fixedOverflowWidgets: true,
  fontSize: 14,
  lineNumbersMinChars: 3,
  lineDecorationsWidth: 2,
  minimap: {
    enabled: false,
  },
  renderValidationDecorations: 'editable',
  overviewRulerLanes: 0,
  renderLineHighlightOnlyWhenFocus: true,
  scrollBeyondLastLine: false,
}

const loadRequests = (importedRequests: Array<Partial<Request>>) => {
  const loadedRequests: Record<string, Request> = {}

  try {
    const requests: Array<Partial<Request>> = importedRequests

    for (const [i, request] of requests.entries()) {
      const err = transformCheckRequest(request)
      if (err !== undefined) {
        if (importedRequests === undefined) {
          // Loading from local storage
          console.warn('[router-playground] Failed to load request: ', err, '. ', JSON.stringify(request))
        } else {
          // Loading from imported requests
          throw new Error(i18n.t('errors.failedToImport', { i, err }))
        }
      } else {
        loadedRequests[(request as Request).id] = request as Request
      }
    }

  } catch (err: any) {
    if (importedRequests === undefined) {
      // Loading from local storage
      console.error(err)
    } else {
      // Loading from imported requests
      throw err
    }
  }

  return Object.values(loadedRequests)
}

const handleProceed = () => {
  let hasError = false
  let requests: Request[] = []

  try {
    requests = JSON.parse(json.value)
    if (!Array.isArray(requests)) {
      throw new Error(i18n.t('requestImport.jsonError'))
    }
    emit('import', loadRequests(requests))
  } catch (e: any) {
    errorMessage.value = e.message
    hasError = true
  }

  if (!hasError) {
    errorMessage.value = undefined
    emit('dismiss', true)
  }
}

</script>

<style lang="scss" scoped>
.import-requests-modal {
  :deep(.modal-content) {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-60, $kui-space-60);
  }

  .json-editor {
    height: 500px;
  }

  .warning {
    color: #FABE5F;
  }
}
</style>
