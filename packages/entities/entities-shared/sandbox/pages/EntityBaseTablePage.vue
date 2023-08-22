<template>
  <div class="sandbox-container">
    <EntityBaseTable
      :empty-state-options="emptyStateOptions"
      :fetcher="fetcher"
      :fetcher-cache-key="fetchCacheKey"
      :is-loading="isLoading"
      :query="query"
      :table-headers="headers"
      title="Title"
      @clear-search-input="clearQuery"
      @click:row="handleRowClick"
    >
      <template
        v-if="hasData || query"
        #toolbar-filter
      >
        <input
          v-model="query"
          type="text"
        >
      </template>
      <template
        v-if="hasData || query"
        #toolbar-button
      >
        <button>Button</button>
      </template>
      <template #name="{ rowValue }">
        <strong class="entity-name">{{ rowValue }}</strong>
      </template>
      <template #protocols="{ rowValue }">
        <KBadge
          v-for="protocol in rowValue"
          :key="protocol"
          @click.stop
        >
          {{ protocol }}
        </KBadge>
      </template>
      <template #methods="{ rowValue }">
        <KBadge
          v-for="method in rowValue"
          :key="method"
          @click.stop
        >
          {{ method }}
        </KBadge>
      </template>
      <template #actions="{ row }">
        <KDropdownItem
          data-testaction="menu-update"
          @click="editEntity(row)"
        >
          Edit
        </KDropdownItem>
        <KDropdownItem
          data-testaction="menu-delete"
          has-divider
          is-dangerous
          @click="deleteEntity(row)"
        >
          Delete
        </KDropdownItem>
      </template>
    </EntityBaseTable>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { EntityBaseTable } from '../../src'
import type { FetcherParams, FetcherResponse } from '../../src'
import { mockTableHeaders, mockTableData } from '../../fixtures/mockData'

const headers = mockTableHeaders

const emptyStateOptions = {
  ctaText: 'New Route',
  ctaPath: '/',
  message: 'A Route defines rules to match client requests, and is associated with a Gateway Service.',
  title: 'Configure a New Route',
}

const isLoading = ref(false)
const hasData = ref(false)
const query = ref('')
const fetchCacheKey = ref(1)

const fetcher = (params: FetcherParams): Promise<FetcherResponse> => {
  isLoading.value = true

  return new Promise(resolve => {
    setTimeout(() => {
      isLoading.value = false

      // Mock the `No results found` state
      if (params.query) {
        hasData.value = false
        resolve({
          data: [],
          total: 0,
        })
        return
      }

      hasData.value = true
      resolve(mockTableData)
    }, 500)
  })
}

const clearQuery = () => {
  isLoading.value = true
  query.value = ''
}

const handleRowClick = (row: object) => {
  console.log(`clicked: ${JSON.stringify(row)}`)
}

const editEntity = (row: typeof headers) => {
  console.log(`edit: ${row.name}`)
}

const deleteEntity = (row: typeof headers) => {
  console.log(`delete: ${row.name}`)
  fetchCacheKey.value++
}
</script>

<style lang="scss" scoped>
.sandbox-container {
  padding: 40px;
}

.entity-name {
  font-weight: 600;
}
</style>
