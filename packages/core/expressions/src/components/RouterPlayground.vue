<template>
  <div class="router-playground-wrapper">
    <div class="router-playground">
      <SupportText>
        <i18nT
          keypath="routerPlayground.help"
          tag="p"
        >
          <template #link>
            <KExternalLink :href="externalLinks.expressionsLanguageDoc">
              {{ i18n.t('routerPlayground.learnMore') }}
            </KExternalLink>
          </template>
        </i18nT>
      </SupportText>

      <PageHeader
        data-testid="expression-header"
        :size="4"
        :title="i18n.t('routerPlayground.expressions')"
      />

      <ExpressionsEditor
        v-model="expression"
        data-testid="expressions-editor"
        :schema="editorSchema"
      />

      <div
        v-if="!hideEditorActions"
        class="editor-actions"
      >
        <KButton
          appearance="primary"
          data-testid="btn-commit"
          size="small"
          @click="handleCommit"
        >
          {{ i18n.t('routerPlayground.addToRoute') }}
        </KButton>
      </div>

      <div
        v-if="expression.trim().length === 0"
        class="expression-inspirations"
        data-testid="expressions-inspirations"
      >
        <div class="title">
          <RocketIcon size="16px" />
          <span>{{ i18n.t('routerPlayground.inspiration') }}</span>
        </div>
        <div class="buttons">
          <KButton
            v-for="(exp, i) in expressionInspirations"
            :key="btoa(exp)"
            appearance="secondary"
            class="expression-inspiration-item"
            :data-testid="'btn-inspiration-' + i"
            size="small"
            @click="expression = exp"
          >
            {{ exp }}
          </KButton>
        </div>
      </div>

      <PageHeader
        class="routes"
        data-testid="requests-header"
        :size="4"
        title="Requests"
      >
        <div class="actions">
          <KTooltip :text="i18n.t('routerPlayground.importTooltip')">
            <KButton
              appearance="tertiary"
              class="import-button"
              data-testid="btn-import"
              size="small"
              @click="currentModal = Modal.IMPORT"
            >
              {{ i18n.t('routerPlayground.import') }}
            </KButton>
          </KTooltip>
          <KTooltip
            v-if="requests.length > 0"
            :text="i18n.t('routerPlayground.exportTooltip')"
          >
            <KButton
              appearance="tertiary"
              class="export-button"
              data-testid="btn-export"
              size="small"
              @click="handleExportRequests"
            >
              {{ i18n.t('routerPlayground.export') }}
            </KButton>
          </KTooltip>
          <KButton
            appearance="secondary"
            data-testid="btn-add-request"
            size="small"
            @click="currentModal = Modal.ADD"
          >
            {{ i18n.t('routerPlayground.add') }}
          </KButton>
        </div>
      </PageHeader>

      <KEmptyState
        v-if="requests.length === 0"
        :action-button-text="i18n.t('routerPlayground.addRequest')"
        data-testid="empty-state-requests"
        @click-action="handleAddRequestCTA"
      >
        <template #title>
          {{ i18n.t('routerPlayground.noRequests') }}
        </template>
        <template #default>
          {{ i18n.t('routerPlayground.noRequestsDescription') }}
        </template>
      </KEmptyState>

      <div class="route-cards">
        <RequestCard
          v-for="route in requests"
          :key="route.id"
          :active="routeMatches[route.id]"
          :data-testid="route.id"
          :headers="route.headers"
          :host="route.host"
          :method="route.method"
          :path="route.path"
          :port="route.port"
          :protocol="route.protocol"
          :sni="route.sni"
          @remove="handleRemoveRequest(route.id)"
        />
      </div>

      <i18n-t
        v-if="requests.length > 0"
        class="route-cards-footer"
        keypath="routerPlayground.clearRequests"
        tag="div"
      >
        <template #link>
          <span
            class="link"
            data-testid="clear-requests-link"
            @click="currentModal = Modal.CLEAR"
          >{{ i18n.t('routerPlayground.click') }}</span>
        </template>
      </i18n-t>

      <Teleport to="body">
        <RequestModal
          v-if="currentModal === Modal.ADD"
          :visible="currentModal === Modal.ADD"
          @add-request="requests.push($event)"
          @dismiss="onDismissRequestModal"
        />

        <RequestImportModal
          v-if="currentModal === Modal.IMPORT"
          :visible="currentModal === Modal.IMPORT"
          @dismiss="onDismissImportModal"
          @import="requests = $event"
        />

        <KModal
          v-if="currentModal === Modal.CLEAR"
          action-button-appearance="danger"
          action-button-text="Clear"
          title="Warning"
          :visible="currentModal === Modal.CLEAR"
          @cancel="currentModal = undefined"
          @proceed="handleClearRequests"
        >
          <template #default>
            {{ i18n.t('routerPlayground.clearRequestsPrompt') }}
          </template>
        </KModal>
      </Teleport>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onUnmounted, ref, type Ref, watch } from 'vue'
import { createSchema, HTTP_SCHEMA_DEFINITION } from '../schema'
import { v4 as uuidv4 } from 'uuid'
import * as Atc from '@kong/atc-router'
import ExpressionsEditor from './ExpressionsEditor.vue'
import PageHeader from './PageHeader.vue'
import RequestCard from './RequestCard.vue'
import RequestImportModal from './RequestImportModal.vue'
import RequestModal from './RequestModal.vue'
import type { Request } from '../definitions'
import { transformCheckRequest } from '../utils'
import SupportText from './SupportText.vue'
import composables from '../composables'
import { RocketIcon } from '@kong/icons'
import externalLinks from '../external-links'

const { i18n, i18nT } = composables.useI18n()

const DEFAULT_LS_KEY = 'kong-manager-router-playground-requests'

export type Props = {
  /**
   * @default 'kong-manager-router-playground-requests'
   */
  localstorageKey?: string
  hideEditorActions?: boolean
  initialExpression?: string
}

export type Emits = {
  change: [expression: string]
  commit: [expression: string]
  notify: [{ message: string, type: string }]
}

enum Modal {
  ADD = 1,
  IMPORT = 2,
  CLEAR = 3,
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

// As the router playground currently only support HTTP based protocols, we will pin HTTP schema here for now
const editorSchema = computed(() => ({ name: 'http', definition: HTTP_SCHEMA_DEFINITION }))

const testSchema = createSchema(HTTP_SCHEMA_DEFINITION)

const testRouter: Ref<Atc.Router | undefined> = ref()

const expression = ref(props.initialExpression as string ?? '')

const localstorageKey = ref(props.localstorageKey ?? DEFAULT_LS_KEY)

const loadRequests = () => {
  const loadedRequests: Request[] = []

  try {
    const requests: Array<Partial<Request>> = JSON.parse(localStorage.getItem(localstorageKey.value) ?? '[]')

    for (const [, request] of requests.entries()) {
      const err = transformCheckRequest(request)
      if (err !== undefined) {
        // Loading from local storage
        console.warn('[router-playground] Failed to load request: ', err, '. ', JSON.stringify(request))
      } else {
        loadedRequests.push(request as Request)
      }
    }

  } catch (err: any) {
    console.error(err)
  }

  return loadedRequests
}

const requests = ref<Request[]>(loadRequests())

const expressionInspirations = [
  'http.host == "localhost"',
  'net.protocol ~ "^https?$"',
  'net.protocol ~ "^https?$" && net.dst.port == 80',
]

const currentModal = ref<Modal | undefined>(undefined)

const routeMatches = computed<{ [id: string]: boolean }>(() => requests.value.reduce((map, route) => {
  if (testRouter.value === undefined) {
    map[route.id] = false

    return map
  }

  const context = new Atc.Context(testSchema)

  context.addValue('net.protocol', { String: route.protocol })
  context.addValue('net.dst.port', { Int: route.port })

  context.addValue('http.host', { String: route.host })
  context.addValue('http.path', { String: route.path })

  if (route.method) {
    context.addValue('http.method', { String: route.method })
  }

  if (route.headers) {
    Object.entries(route.headers).forEach(([key, values]) => {
      const headerKey = `http.headers.${key.toLowerCase().replace(/-/g, '_')}`
      const valueSet: string[] = Array.isArray(values) ? values : [values]
      valueSet.forEach((value) => {
        context.addValue(headerKey, { String: `${value}` })
      })
    })
  }

  if (route.sni) {
    context.addValue('tls.sni', { String: route.sni })
  }

  const match = testRouter.value.execute(context)

  context.free()

  map[route.id] = match

  return map
}, {} as Record<string, boolean>))

const btoa = (s: string) => window.btoa(s)

const handleCommit = () => {
  emit('commit', expression.value)
}

const handleExportRequests = () => {
  navigator.clipboard.writeText(JSON.stringify(requests.value))
  emit('notify', { message: i18n.t('routerPlayground.notifyCopy'), type: 'success' })
}

const handleAddRequestCTA = () => {
  currentModal.value = Modal.ADD
}

const handleClearRequests = () => {
  requests.value = []
  currentModal.value = undefined
  emit('notify', { message: i18n.t('routerPlayground.notifyClear'), type: 'success' })
}

const handleRemoveRequest = (id: string) => {
  requests.value = requests.value.filter((route) => route.id !== id)
}

const onDismissImportModal = (completed: boolean) => {
  if (completed) {
    emit('notify', { message: i18n.t('routerPlayground.notifyImport'), type: 'success' })
  }

  currentModal.value = undefined
}

const onDismissRequestModal = () => {
  currentModal.value = undefined
}

watch(expression, (expression) => {
  emit('change', expression)

  if (testRouter.value !== undefined) {
    testRouter.value.free()
    testRouter.value = undefined
  }

  const router = new Atc.Router(testSchema)

  if (router.addMatcher(0, uuidv4(), expression) === undefined) {
    testRouter.value = router
  }
}, { immediate: true })

watch(requests, (requests) => {
  if (!localstorageKey.value.length) {
    localStorage.removeItem(localstorageKey.value)
  } else {
    localStorage.setItem(localstorageKey.value, JSON.stringify(requests))
  }
}, { deep: true })

onUnmounted(() => {
  testSchema.free()
  if (testRouter.value !== undefined) {
    testRouter.value.free()
    testRouter.value = undefined
  }
})
</script>

<style lang="scss" scoped>
.router-playground-wrapper {
  .page-header {
    color: var(--kui-color-text, $kui-color-text);
    font-size: var(--kui-font-size-70, $kui-font-size-70);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
  }

  .editor-actions {
    display: flex;
    flex-direction: row;
    justify-content: flex-end;
    margin-top: var(--kui-space-60, $kui-space-60);
    width: 100%;
  }

  .router-playground {
    margin: auto;

    .navigate-back {
      align-items: center;
      color: var(--kui-color-text-primary-strong, $kui-color-text-primary-strong);
      cursor: pointer;
      display: flex;
      flex-direction: row;
      font-size: var(--kui-font-size-40, $kui-font-size-40);
      font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
      gap: var(--kui-space-40, $kui-space-40);
      justify-content: flex-start;
      margin-bottom: var(--kui-space-110, $kui-space-110);
      margin-top: 10px;

      .material-icons {
        font-size: var(--kui-font-size-30, $kui-font-size-30);
      }
    }

    .expression-inspirations {
      margin-top: var(--kui-space-60, $kui-space-60);

      .title {
        align-items: center;
        color: var(--kui-color-text-neutral, $kui-color-text-neutral);
        display: flex;
        flex-direction: row;
        font-size: var(--kui-font-size-30, $kui-font-size-30);
        font-weight: bold;
        gap: var(--kui-space-40, $kui-space-40);
        justify-content: flex-start;
        margin-top: 10px;

        .material-icons {
          font-size: var(--kui-font-size-30, $kui-font-size-30);
        }
      }

      .buttons {
        align-items: center;
        display: flex;
        flex-direction: row;
        gap: var(--kui-space-40, $kui-space-40);
        margin-top: var(--kui-space-50, $kui-space-50);

        button.expression-inspiration-item {
          border-style: solid;
          font-family: var(--kui-font-family-code, $kui-font-family-code);
        }
      }
    }

    .expression-editor-caption {
      align-items: center;
      display: flex;
      flex-direction: row;
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      justify-content: flex-start;
      margin: var(--kui-space-40, $kui-space-40) var(--kui-space-0, $kui-space-0);
      opacity: 0.7;
    }

    .expression-list {
      tbody tr {
        font-family: var(--kui-font-family-code, $kui-font-family-code);
      }
    }

    .routes {
      margin-top: var(--kui-space-90, $kui-space-90);

      .actions {
        align-items: center;
        display: flex;
        flex-direction: row;
        gap: var(--kui-space-40, $kui-space-40);
      }
    }

    .import-button,
    .export-button {
      margin-right: var(--kui-space-50, $kui-space-50);
    }

    .route-cards {
      display: grid;
      gap: var(--kui-space-60, $kui-space-60);
      grid-template-columns: 1fr 1fr 1fr;
    }

    .route-cards-footer {
      align-items: center;
      display: flex;
      flex-direction: row;
      font-size: var(--kui-font-size-30, $kui-font-size-30);
      justify-content: center;
      margin: var(--kui-space-60, $kui-space-60) var(--kui-space-0, $kui-space-0) var(--kui-space-40, $kui-space-40);
      opacity: 0.7;
    }
  }

  .link {
    cursor: pointer;
    margin: 0 var(--kui-space-10, $kui-space-10);
    text-decoration: underline;
  }
}

</style>
