<template>
  <KModal
    action-button-text="Import"
    class="import-requests-modal"
    text-align="left"
    :title="i18n.t('requestImport.title')"
    :visible="props.visible"
    @cancel="emit('dismiss', false)"
    @proceed="handleProceed"
  >
    <template #default>
      <KAlert
        appearance="warning"
        class="import-requests-alert"
      >
        <template #default>
          <i18n-t
            keypath="requestImport.warning"
            tag="p"
          >
            <template #boldText>
              <strong>{{ i18n.t('requestImport.warningBoldText') }}</strong>
            </template>
          </i18n-t>
        </template>
      </KAlert>

      <MonacoEditor
        ref="editors"
        v-model="json"
        class="json-editor"
        data-testid="import-requests-editor"
        language="json"
        :options="options"
      />

      <KAlert
        v-if="errorMessage"
        appearance="danger"
        class="import-requests-error"
        :message="errorMessage"
      />
    </template>
  </KModal>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { transformCheckRequest } from '../utils'
import MonacoEditor from './MonacoEditor.vue'
import type { Request } from '../definitions'
import type * as Monaco from 'monaco-editor'
import composables from '../composables'

const { i18n, i18nT } = composables.useI18n()

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  dismiss: [completed: boolean]
  import: [requests: Request[]]
}>()

// const playgroundStore = useRouterPlaygroundStore()

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

const loadRequests = (importedRequests: Partial<Request>[]) => {
  const loadedRequests: Record<string, Request> = {}

  try {
    const requests: Partial<Request>[] = importedRequests

    for (const [i, request] of requests.entries()) {
      const err = transformCheckRequest(request)
      if (err !== undefined) {
        if (importedRequests === undefined) {
          // Loading from local storage
          console.warn('[router-playground] Failed to load request: ', err, '. ', JSON.stringify(request))
        } else {
          // Loading from imported requests
          throw new Error(`Failed to import request #${i}: ${err}`)
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
  .import-requests-alert {
    margin-bottom: $kui-space-60;
  }

  .import-requests-error {
    margin-top: $kui-space-60;
  }

  .json-editor {
    border: $kui-border-width-10 solid $kui-color-border;
    border-radius: $kui-border-radius-20;
    height: 500px;
    overflow: hidden;
    width: 100%;
  }

  .warning {
    color: #FABE5F;
  }
}
</style>
