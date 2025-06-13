<template>
  <div
    class="slideout-trigger"
  >
    <div>
      Click
      <KButton
        appearance="primary"
        size="large"
        @click="slideoutVisible = !slideoutVisible"
      >
        HERE
      </KButton>
      to toggle the slideout<br>
      Slideout overlay is OFF (not a bug)<br>
      Click the close button to dismiss the slideout (not a bug)<br>
    </div>

    <KSlideout
      class="trace-viewer-slideout"
      :close-on-blur="false"
      :has-overlay="false"
      max-width="min(100%, 1200px)"
      :visible="slideoutVisible"
      @close="slideoutVisible = false"
    >
      <template #title>
        <template v-if="showSkeleton">
          <KSkeletonBox
            height="2"
            width="50"
          />
        </template>
        <template v-else>
          <KBadge appearance="success">
            200
          </KBadge>

          <div class="trace-viewer-title-request-line">
            GET /kong
          </div>
        </template>
      </template>

      <KTabs
        v-model="tab"
        class="tabs"
        :data-active-panel="tabs.findIndex(({ hash }) => hash === tab)"
        :tabs="tabs"
      >
        <template #summary>
          <SummaryViewTab
            :payloads="enablePayloads ? payloads : undefined"
            :root-span="spanTrees.roots[0]"
            :show-skeleton="showSkeleton"
          />
        </template>
        <template #trace>
          <TraceViewTab
            :config="config"
            :root-span="spanTrees.roots[0]"
            :show-skeleton="showSkeleton"
            :show-view-logs-button="enableViewSpanLogs"
            :url="url"
          />
        </template>
      </KTabs>
    </KSlideout>

    <KCard
      class="controls"
      title="Controls"
    >
      <KInputSwitch
        v-model="hasRequests"
        label="Requests"
      />

      <KInputSwitch
        v-model="hasResponses"
        label="Responses"
      />

      <KInputSwitch
        v-model="hasClientIn"
        label="Client In"
      />

      <KInputSwitch
        v-model="hasClientOut"
        label="Client Out"
      />

      <KInputSwitch
        v-model="hasUpstreamIn"
        label="Upstream In"
      />

      <KInputSwitch
        v-model="hasUpstreamOut"
        label="Upstream Out"
      />

      <hr>

      <KInputSwitch
        v-model="showSkeleton"
        label="Skeleton"
      />

      <KInputSwitch
        v-model="enablePayloads"
        label="Payloads"
      />

      <KInputSwitch
        v-model="enableViewSpanLogs"
        label="Show 'View Span Logs' button"
      />
    </KCard>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { Body, Headers, SpanNode } from '../../src'
import { buildSpanTrees, getPhaseAndPlugin, KONG_PHASES, mergeSpansInTraceBatches, SPAN_NAMES, SummaryViewTab, TraceViewTab, type TraceViewerConfig } from '../../src'
import traceBatches from '../fixtures/trace-batches.json'

const hasRequests = ref(true)
const hasResponses = ref(true)

const hasClientIn = ref(true)
const hasClientOut = ref(true)

const hasUpstreamIn = ref(true)
const hasUpstreamOut = ref(true)

const trimTree = (tree: SpanNode) => {
  tree.children = tree.children.filter((node) => {
    const pluginSpan = getPhaseAndPlugin(node.span.name)
    if (pluginSpan) {
      switch (pluginSpan.phase) {
        case KONG_PHASES.CERTIFICATE:
        case KONG_PHASES.REWRITE:
        case KONG_PHASES.ACCESS:
          return hasRequests.value
        case KONG_PHASES.RESPONSE:
        case KONG_PHASES.HEADER_FILTER:
        case KONG_PHASES.BODY_FILTER:
          return hasResponses.value
        default:
          return true
      }
    }

    switch (node.span.name) {
      case SPAN_NAMES.CLIENT_HEADERS:
      case SPAN_NAMES.READ_BODY:
        return hasClientOut.value
      case SPAN_NAMES.FLUSH_TO_DOWNSTREAM:
        return hasClientIn.value
      case SPAN_NAMES.KONG_UPSTREAM_SELECTION:
      case SPAN_NAMES.KONG_SEND_REQUEST_TO_UPSTREAM:
        return hasUpstreamIn.value
      case SPAN_NAMES.KONG_READ_HEADERS_FROM_UPSTREAM:
      case SPAN_NAMES.KONG_READ_BODY_FROM_UPSTREAM:
        return hasUpstreamOut.value
      default:
        return true
    }
  })
  tree.children.forEach(trimTree)
}

const spanTrees = computed(() => {
  const trees = buildSpanTrees(mergeSpansInTraceBatches(traceBatches))
  trimTree(trees.roots[0])
  return trees
})

const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const showSkeleton = ref(false)
const enablePayloads = ref(true)
const enableViewSpanLogs = ref(true)
const slideoutVisible = ref(true)
const tabs = [
  { hash: '#summary', title: 'Summary' },
  { hash: '#trace', title: 'Trace' },
]
const tab = ref(tabs[0].hash)

const config: TraceViewerConfig = {
  buildEntityLink: (request) => {
    const entityQuery = request.plugin ? `${request.plugin}/${request.entityId}` : request.entityId
    return `https://cloud.konghq.tech/us/gateway-manager/${controlPlaneId}/${request.entity}/${entityQuery}`
  },
  getEntityLinkData: async (request) => {
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      id: request.entityId,
      label: `${request.entity} ${request.entityId}`,
    }
  },
}

const path = `/${Array(10).fill(null).map(() => Math.random().toString(36).slice(2)).join('/')}`
const url = `https://example.com${path}`

const payloads = {
  headers: {
    request: {
      accept: 'application/json, */*;q=0.5',
      'accept-encoding': 'gzip, deflate',
      connection: 'keep-alive',
      'content-length': '52',
      'content-type': 'application/json',
      host: 'localhost:9000',
      'user-agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
    } as Headers,
    response: {
      'access-control-allow-credentials': 'true',
      'access-control-allow-origin': '*',
      connection: 'keep-alive',
      'content-length': '711',
      'content-type': 'application/json',
      date: 'Wed, 22 Jan 2025 04:13:42 GMT',
      server: 'gunicorn/19.9.0',
      via: '1.1 kong/3.10.0.0-enterprise-edition',
      'x-kong-proxy-latency': '1',
      'x-kong-request-id': 'a73f461362afd95e80fd5027a1259861',
      'x-kong-upstream-latency': '410',
    } as Headers,
  },
  body:{
    request: JSON.stringify({
      order_id: '5d396641-480b-46c9-9687-7d5e73c18732',
    }) as Body,
    response: JSON.stringify({
      args: {},
      data: { 'order_id ': '5d396641-480b-46c9-9687-7d5e73c18732' },
      files: {},
      form: {},
      headers: {
        Accept: 'application/json, */*;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'Content-Length': '52',
        'Content-Type': 'application/json',
        Host: 'httpbin.org',
        'User-Agent': 'HTTPie/3.2.4',
        'X-Amzn-Trace-Id': 'Root=1-67907076-5c425a3a715c7b1e7cb239eb',
        'X-Forwarded-Host': 'localhost',
        'X-Forwarded-Path': '/post',
        'X-Kong-Request-Id': 'a73f461362afd95e80fd5027a1259861',
      },
      json: {
        order_id: '5d396641-480b-46c9-9687-7d5e73c18732',
      },
      origin: '10.0.0.1, 10.0.0.2',
      url: 'http://localhost/post',
    }) as Body,
  },
}
</script>

<style lang="scss" scoped>
.slideout-trigger {
  position: fixed;
  top: 0;
  left: 0;
  width: 100dvw;
  height: 100dvh;
  padding: 16px;

  .trace-select {
    margin-top: $kui-space-60;
    max-width: 200px;
  }
}

.trace-viewer-slideout {
  .trace-viewer-title-request-line {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  :deep(.slideout-container) {
    box-sizing: border-box;

    .slideout-title {
      flex-shrink: 1;
      min-width: 0;
      height: 28px; // $kui-line-height-50
      line-height: $kui-line-height-50;
    }

    .slideout-content {
      flex-grow: 1;

      > :last-child {
        padding-bottom: 0;
      }

      [role="tablist"] {
        margin-bottom: 0;
      }
    }
  }

  :deep(.tab-container) {
    height: 100%;
  }

  :deep(.tabs.k-tabs) {
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    height: 100%;
    padding-bottom: 0;

    > [role="tablist"] {
      flex-shrink: 0;
      padding-left: 0;
      padding-right: 0;
    }

    > [role="tabpanel"] {
      min-height: 0;
    }

    &[data-active-panel="0"] :not([id="panel-0"])[role="tabpanel"] {
      display: none;
    }

    &[data-active-panel="1"] :not([id="panel-1"])[role="tabpanel"] {
      display: none;
    }
  }
}

.controls {
  z-index: 10000;
  bottom: 16px;
  left: 16px;
  margin-bottom: 16px;
  position: fixed;
  width: auto;

  :deep(.card-content) {
    align-items: flex-start;
    display: flex;
    flex-direction: column;
    gap: 12px;
    justify-content: flex-start;
  }
}
</style>
