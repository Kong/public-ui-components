<template>
  <SandboxLayout
    :links="appLinks"
    title="Sankey"
  >
    <section class="example">
      <h2>Model usage by consumer (top 5 consumers of each top 5 model)</h2>
      <SankeyChart
        height="560px"
        :links="modelUsage.links"
        :nodes="modelUsage.nodes"
        series-name="Requests"
        tooltip-title="Model usage by consumer"
        :value-formatter="formatCount"
      />
      <p>Like a dashboard tile built from one query grouped by model and consumer: each model links to its own top 5 consumers, so consumers shared between models appear once. Model nodes are sized by their full total, so they keep their ranking even though traffic to their other consumers isn't drawn.</p>
    </section>

    <section class="example">
      <h2>Three columns with values</h2>
      <SankeyChart
        :links="statusFlow.links"
        :nodes="statusFlow.nodes"
        series-name="Requests"
        show-values
        :value-formatter="formatCount"
      />
      <p>Provider, model and status code. The <code>Other</code> label appears in two columns: each node has its own <code>id</code>, so they stay separate.</p>
    </section>

    <section class="example">
      <h2>Colors from data with gradient links</h2>
      <SankeyChart
        link-color="gradient"
        :links="statusFlow.links"
        :nodes="coloredStatusFlow"
        series-name="Requests"
        :value-formatter="formatCount"
      />
    </section>
  </SandboxLayout>
</template>

<script setup lang="ts">
import { SankeyChart } from '../../src'
import type { SankeyLink, SankeyNode } from '../../src'
import { appLinks } from '../navigation'

const formatCount = (value: number) => value.toLocaleString()

const MODELS = ['deepseek-v4-flash', 'glm-5-flash', 'deepseek-v4', 'claude-opus-5-5', 'glm-5']

// Each model's total requests, and its top 5 consumers. Two consumers use two models each
const MODEL_TOTALS = [245000, 170000, 114000, 58500, 35900]
const TOP_CONSUMERS: Array<Array<[string, number]>> = [
  [['maple.ridge@example.com', 43100], ['quinn.harper@example.com', 24300], ['sora.tanaka@example.com', 23000], ['elena.vargas@example.com', 17200], ['noah.fischer@example.com', 11600]],
  [['priya.nair@example.com', 13300], ['oscar.lindqvist@example.com', 12200], ['mina.park@example.com', 11100], ['felix.moreau@example.com', 9800], ['ines.duarte@example.com', 7700]],
  [['ci/review-agent', 17500], ['ci/operator', 12500], ['ci/enterprise', 8700], ['ci/platform-api', 6200], ['ci/docs', 5700]],
  [['hugo.bennett@example.com', 7700], ['lena.kowalski@example.com', 2900], ['amir.rahimi@example.com', 2700], ['tara.okafor@example.com', 2600], ['maple.ridge@example.com', 2300]],
  [['viktor.novak@example.com', 2900], ['ines.duarte@example.com', 2800], ['yuki.sato@example.com', 2200], ['cora.finch@example.com', 1800], ['dev.malhotra@example.com', 1500]],
]

const consumerIds = new Set(TOP_CONSUMERS.flat().map(([consumer]) => consumer))

const modelUsage: { nodes: SankeyNode[], links: SankeyLink[] } = {
  nodes: [
    // `value`: the model's full total, larger than its links to its top consumers
    ...MODELS.map((model, index) => ({ id: `model:${model}`, name: model, value: MODEL_TOTALS[index] })),
    ...[...consumerIds].map((consumer) => ({ id: `consumer:${consumer}`, name: consumer })),
  ],
  links: TOP_CONSUMERS.flatMap((consumers, index) => consumers.map(([consumer, value]) => ({
    source: `model:${MODELS[index]}`,
    target: `consumer:${consumer}`,
    value,
  }))),
}

const statusFlow: { nodes: SankeyNode[], links: SankeyLink[] } = {
  nodes: [
    { id: 'provider:openai', name: 'OpenAI' },
    { id: 'provider:anthropic', name: 'Anthropic' },
    { id: 'provider:other', name: 'Other' },
    { id: 'model:gpt-5', name: 'gpt-5' },
    { id: 'model:gpt-5-mini', name: 'gpt-5-mini' },
    { id: 'model:claude-sonnet-5-5', name: 'claude-sonnet-5-5' },
    { id: 'model:other', name: 'Other' },
    { id: 'status:2XX', name: '2XX' },
    { id: 'status:4XX', name: '4XX' },
    { id: 'status:5XX', name: '5XX' },
  ],
  links: [
    { source: 'provider:openai', target: 'model:gpt-5', value: 4200 },
    { source: 'provider:openai', target: 'model:gpt-5-mini', value: 2600 },
    { source: 'provider:anthropic', target: 'model:claude-sonnet-5-5', value: 5100 },
    { source: 'provider:other', target: 'model:other', value: 900 },
    { source: 'model:gpt-5', target: 'status:2XX', value: 3900 },
    { source: 'model:gpt-5', target: 'status:4XX', value: 200 },
    { source: 'model:gpt-5', target: 'status:5XX', value: 100 },
    { source: 'model:gpt-5-mini', target: 'status:2XX', value: 2500 },
    { source: 'model:gpt-5-mini', target: 'status:4XX', value: 100 },
    { source: 'model:claude-sonnet-5-5', target: 'status:2XX', value: 4700 },
    { source: 'model:claude-sonnet-5-5', target: 'status:5XX', value: 400 },
    { source: 'model:other', target: 'status:2XX', value: 800 },
    { source: 'model:other', target: 'status:4XX', value: 100 },
  ],
}

// Status nodes colored by meaning, the rest from the default palette
const STATUS_COLORS: Record<string, string> = {
  'status:2XX': '#00d6a4',
  'status:4XX': '#ffc400',
  'status:5XX': '#ff3954',
}

const coloredStatusFlow: SankeyNode[] = statusFlow.nodes.map((node) => (
  STATUS_COLORS[node.id] ? { ...node, itemStyle: { color: STATUS_COLORS[node.id] } } : node
))
</script>

<style lang="scss" scoped>
.example {
  margin-bottom: var(--kui-space-70, 32px);

  h2 {
    margin-bottom: var(--kui-space-40, 16px);
  }
}
</style>
