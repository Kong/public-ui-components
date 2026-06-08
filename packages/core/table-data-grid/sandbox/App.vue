<template>
  <main class="sandbox">
    <header class="sandbox-header">
      <h1>TableDataGrid</h1>
      <p>Basic fetcher render example for the initial AG Grid wrapper.</p>
    </header>

    <TableDataGrid
      :fetcher="fetchRows"
      :headers="headers"
    />
  </main>
</template>

<script setup lang="ts">
import type { TableDataGridFetcher, TableDataGridHeader } from '../src'
import { TableDataGrid } from '../src'

type SandboxRow = {
  id: string
  name: string
  status: string
  latency: string
}

const headers: Array<TableDataGridHeader<SandboxRow>> = [
  { key: 'name', label: 'Name', width: 220 },
  { key: 'status', label: 'Status', width: 140 },
  { key: 'latency', label: 'Latency', width: 160 },
]

const rows: SandboxRow[] = [
  { id: 'row-1', name: 'Gateway service', status: 'Active', latency: '42 ms' },
  { id: 'row-2', name: 'Portal app', status: 'Inactive', latency: '128 ms' },
  { id: 'row-3', name: 'Analytics API', status: 'Active', latency: '86 ms' },
]

const fetchRows: TableDataGridFetcher<SandboxRow> = async () => ({
  data: rows,
  total: rows.length,
})
</script>

<style lang="scss" scoped>
.sandbox {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-70, $kui-space-70);
  padding: var(--kui-space-80, $kui-space-80);
}

.sandbox-header {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-20, $kui-space-20);
}

.sandbox-header h1,
.sandbox-header p {
  margin: 0;
}
</style>
