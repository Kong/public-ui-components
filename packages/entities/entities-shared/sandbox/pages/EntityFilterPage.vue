<template>
  <div class="sandbox-container">
    <section class="entity-filter-section">
      <h3>Exact match</h3>
      <div class="entity-filter-wrapper">
        <EntityFilter
          v-model="queryForExactMatch"
          :config="exactMatchConfig"
        />
        <KButton
          class="reset-button"
          @click="resetExactMatchQuery"
        >
          Reset
        </KButton>
      </div>
      <p>Value: <code>{{ queryForExactMatch }}</code></p>
    </section>
    <section class="entity-filter-section">
      <h3>Fuzzy match</h3>
      <div class="entity-filter-wrapper">
        <EntityFilter
          v-model="queryForFuzzyMatch"
          :config="fuzzyMatchConfig"
        />
        <KButton
          class="reset-button"
          @click="resetFuzzyMatchQuery"
        >
          Reset
        </KButton>
      </div>
      <p>Value: <code>{{ queryForFuzzyMatch }}</code></p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { EntityFilter } from '../../src'
import type { ExactMatchFilterConfig, FuzzyMatchFilterConfig } from '../../src'
import { mockExactMatchFilterConfig, mockFuzzyMatchFilterConfig } from '../../fixtures/mockData'

const exactMatchConfig = mockExactMatchFilterConfig as ExactMatchFilterConfig
const fuzzyMatchConfig = mockFuzzyMatchFilterConfig as FuzzyMatchFilterConfig

const queryForExactMatch = ref('')
const queryForFuzzyMatch = ref('')

const resetExactMatchQuery = () => {
  queryForExactMatch.value = ''
}

const resetFuzzyMatchQuery = () => {
  queryForFuzzyMatch.value = ''
}
</script>

<style lang="scss" scoped>
.entity-filter-section {
  margin: 40px 0 20px;
}

.entity-filter-wrapper {
  align-items: center;
  display: flex;
  justify-content: space-between;
  width: 500px;

  .reset-button {
    margin-left: 60px;
  }
}
</style>
