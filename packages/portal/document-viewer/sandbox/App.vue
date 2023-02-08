<template>
  <div class="sandbox-container">
    <main>
      <div>
        <h3>Default</h3>
        <DocumentViewer :document="defaultDocument" />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import DocumentViewer from '../src'
import { defaultDocument } from '../fixtures/markdown-data'

</script>
