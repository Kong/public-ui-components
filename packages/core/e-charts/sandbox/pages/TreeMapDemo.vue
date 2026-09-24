<template>
  <SandboxLayout
    :links="appLinks"
    title="TreeMap"
  >
    <section class="example">
      <h2>Resource usage (default)</h2>
      <TreeMapChart
        :data="resources"
        series-name="Resources"
      />
      <p>Click a group to zoom into it. Top-level groups each get a color from the default palette.</p>
    </section>

    <section class="example">
      <h2>Dense dashboard card with per-node colors</h2>
      <TreeMapChart
        :data="providerModels"
        series-name="Model usage"
        tooltip-title="Model usage"
        :value-formatter="formatCount"
      />
      <p>Every node carries its own `itemStyle.color`, interpolated across a diverging heatmap scale by overall request rank (heaviest box warmest, lightest coolest) rather than the group palette. `visibleMin: 0` keeps low-share boxes painted, and `nodeClick: false` makes it a static card. Names blank out only where a box is too small for the text.</p>
    </section>

    <section class="example">
      <h2>Values with a formatter</h2>
      <TreeMapChart
        :data="resources"
        series-name="Resources"
        show-values
        :value-formatter="formatBytes"
      />
    </section>
  </SandboxLayout>
</template>

<script setup lang="ts">
import { TreeMapChart } from '../../src'
import type { TreeMapDataNode } from '../../src'
import { appLinks } from '../navigation'

// Deterministic org resource usage: top-level groups with children,
// some of which have grandchildren
const resources: TreeMapDataNode[] = [
  {
    name: 'Gateways',
    children: [
      {
        name: 'us-east',
        children: [
          { name: 'prod', value: 120 },
          { name: 'staging', value: 40 },
        ],
      },
      { name: 'eu-west', value: 200 },
      { name: 'ap-south', value: 90 },
    ],
  },
  {
    name: 'Plugins',
    children: [
      { name: 'rate-limiting', value: 150 },
      { name: 'authentication', value: 80 },
      { name: 'logging', value: 60 },
      { name: 'cors', value: 20 },
    ],
  },
  {
    name: 'Services',
    children: [
      { name: 'billing', value: 110 },
      { name: 'orders', value: 70 },
      { name: 'search', value: 30 },
    ],
  },
  {
    name: 'Data plane nodes',
    children: [
      { name: 'aws', value: 140 },
      { name: 'gcp', value: 50 },
    ],
  },
]

const formatBytes = (value: number) => `${value.toFixed(1)} GB`

const formatCount = (value: number) => value.toLocaleString()

// A long-tail share across many models, like the model-usage dashboard card:
// the top provider dominates, the tail thins out fast
const requestsForRank = (rank: number): number => Math.round(24000 / rank ** 0.82)

// Same seven-stop diverging scale a production usage-by-model card colors its treemap with:
// biggest box warmest (medium red), smallest coolest (medium blue), skipping the two
// darkest stops so nothing goes fully saturated
const DIVERGENT_HEATMAP = ['#2066a8', '#8ec1da', '#cde1ec', '#ededed', '#f6d6c2', '#d47264', '#ae282c']

const DARK_INK = '#2d2d2d'
const DARK_BACKGROUND_LUMA_THRESHOLD = 140

const luma = (hex: string): number => {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const heatmapColorForRank = (rank: number, totalRanked: number): { background: string, ink: string } => {
  const t = totalRanked > 1 ? 1 - (rank - 1) / (totalRanked - 1) : 0
  const background = DIVERGENT_HEATMAP[1 + Math.round(t * (DIVERGENT_HEATMAP.length - 3))]!
  const ink = luma(background) > DARK_BACKGROUND_LUMA_THRESHOLD ? DARK_INK : '#FCF6F5'
  return { background, ink }
}


const MODEL_CATALOG: Record<string, string[]> = {
  OpenAI: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'o3-mini'],
  Anthropic: ['claude-sonnet-4-5', 'claude-opus-4-1', 'claude-haiku-4-5', 'claude-sonnet-4', 'claude-haiku-3-5'],
  Google: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  Meta: ['llama-3.3-70b', 'llama-3.1-405b', 'llama-3.1-8b', 'llama-4-scout', 'llama-4-maverick'],
  'Mistral AI': ['mistral-large-2', 'mistral-small-3', 'mixtral-8x22b', 'codestral-2501', 'pixtral-large'],
  Amazon: ['nova-pro', 'nova-lite', 'nova-micro', 'titan-text-express', 'titan-embed-text'],
  Cohere: ['command-r-plus', 'command-r', 'command-a', 'embed-v3', 'rerank-v3'],
  DeepSeek: ['deepseek-v3', 'deepseek-r1', 'deepseek-coder-v2', 'deepseek-v2-5', 'deepseek-r1-distill'],
}

const MODEL_ENTRIES = Object.entries(MODEL_CATALOG)
const TOTAL_MODELS = MODEL_ENTRIES.reduce((sum, [, models]) => sum + models.length, 0)

let modelRank = 0
const providerModels: TreeMapDataNode[] = MODEL_ENTRIES.map(([provider, models]) => ({
  name: provider,
  children: models.map((model) => {
    modelRank += 1
    return {
      name: model,
      value: requestsForRank(modelRank),
      itemStyle: { color: heatmapColorForRank(modelRank, TOTAL_MODELS).background },
      label: { color: heatmapColorForRank(modelRank, TOTAL_MODELS).ink },
    }
  }),
}))
</script>

<style lang="scss" scoped>
.example {
  margin-bottom: var(--kui-space-70, 32px);

  h2 {
    margin-bottom: var(--kui-space-40, 16px);
  }
}
</style>
