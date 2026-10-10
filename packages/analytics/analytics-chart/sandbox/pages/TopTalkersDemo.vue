<script setup lang="ts">
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import type { SandboxNavigationItem } from '@kong-ui-public/sandbox-layout'

import { inject } from 'vue'

import { TopTalkersGrid } from '../../src'

const OTHER = '____OTHER____'

const raw: Record<string, Array<[string, number, number, number, number]>> = {
  // [id, ai_request_count, error_rate, response_latency_p95, fallbacks]
  llm_model: [
    ['claude-sonnet-4', 2160, 0.021, 1840, 12],
    ['gpt-4o-mini', 1983, 0.014, 920, 8],
    ['claude-haiku', 1965, 0.009, 640, 3],
    ['gpt-4o', 1548, 0.031, 2210, 21],
    ['llama-3.3-70b', 755, 0.052, 3100, 44],
  ],
  llm_provider: [
    ['Anthropic', 3639, 0.016, 1420, 15],
    ['OpenAI', 1975, 0.022, 1610, 29],
    ['Azure OpenAI', 1556, 0.018, 1730, 17],
    ['AWS Bedrock', 1241, 0.048, 2890, 38],
  ],
  agent_name: [
    ['Claude Code', 2666, 0.011, 1210, 9],
    ['Support Bot', 1659, 0.027, 1980, 22],
    ['Kai', 1657, 0.019, 1540, 14],
    ['Hal', 1556, 0.181, 42000, 157],
    ['Doc Assistant', 873, 0.008, 760, 4],
  ],
  user_id: [
    ['alice', 833, 0.017, 1330, 11],
    ['bob', 827, 0.024, 1690, 18],
    ['sarah', 574, 0.012, 1040, 6],
    ['dave', 574, 0.033, 2140, 25],
    ['ed', 565, 0.029, 1870, 20],
    [OTHER, 5038, 0.021, 1580, 96],
  ],
  mcp_server: [
    ['filesystem-mcp', 1651, 0.007, 310, 2],
    ['weather-mcp', 830, 0.015, 540, 7],
    ['postgres-mcp', 786, 0.011, 480, 5],
    ['github-mcp', 780, 0.026, 890, 13],
    ['gmail-mcp', 756, 0.019, 720, 9],
    [OTHER, 1507, 0.023, 810, 31],
  ],
}

const buildResult = (dimension: string): ExploreResultV4 => {
  const rows = raw[dimension]

  return {
    data: rows.map(([id, requests, errorRate, latency, fallbacks]) => ({
      version: 'v1',
      timestamp: '2026-09-21T00:00:00.000Z',
      event: {
        [dimension]: id,
        ai_request_count: requests,
        error_rate: errorRate * 100,
        response_latency_p95: latency,
        fallbacks,
      },
    })),
    meta: {
      start: '2026-09-20T00:00:00.000Z',
      end: '2026-09-21T00:00:00.000Z',
      granularity_ms: 86400000,
      query_id: `demo-${dimension}`,
      metric_names: ['ai_request_count', 'error_rate', 'response_latency_p95', 'fallbacks'] as any,
      metric_units: { ai_request_count: 'count', error_rate: '%', response_latency_p95: 'ms', fallbacks: 'count' } as any,
      display: {
        [dimension]: Object.fromEntries(rows.map(([id]) => [id, { name: id, ...(id === OTHER ? { is_other_group: true } : {}) }])),
      },
    },
  }
}

const appLinks: SandboxNavigationItem[] = inject('app-links', [])

const columns = [
  { dimension: 'llm_model', label: 'Models', data: buildResult('llm_model') },
  { dimension: 'llm_provider', label: 'Providers', data: buildResult('llm_provider') },
  { dimension: 'agent_name', label: 'Agents', data: buildResult('agent_name') },
  { dimension: 'user_id', label: 'Users', data: buildResult('user_id') },
  { dimension: 'mcp_server', label: 'MCP servers', data: buildResult('mcp_server') },
]

const columnOptions = {
  error_rate: { label: 'Error rate', thresholds: [{ type: 'warning' as const, value: 5 }, { type: 'error' as const, value: 15 }] },
  response_latency_p95: { label: 'P95 latency' },
  fallbacks: { label: 'Fallbacks' },
  ai_request_count: { label: 'Requests' },
}
</script>

<template>
  <SandboxLayout
    :links="appLinks"
    title="Analytics Charts"
  >
    <div class="demo-wrapper">
      <TopTalkersGrid
        :column-options="columnOptions"
        :columns="columns"
        size-metric="ai_request_count"
        title="Top 5 consumers by request"
      />
    </div>
  </SandboxLayout>
</template>

<style scoped>
.demo-wrapper {
  height: 420px;
  padding: 24px;
}
</style>

<style>
.sandbox-container {
  min-width: 0;
}
</style>
