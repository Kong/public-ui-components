<template>
  <div class="page-layout-sandbox-app">
    <SandboxLayout>
      <router-view />

      <template #navigation-after>
        <div class="sandbox-control-list">
          <KInputSwitch
            v-model="showTabs"
            label="Tabs"
            label-before
          />
          <KInputSwitch
            v-model="showKaiButton"
            label="Ask KAi button"
            label-before
          />
          <KInputSwitch
            v-model="showTitleAfter"
            label="Title-after content"
            label-before
          />
        </div>
      </template>
    </SandboxLayout>
  </div>
</template>

<script setup lang="ts">
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import { useSandboxControls } from './composables/useSandboxControls'

const { showTabs, showKaiButton, showTitleAfter } = useSandboxControls()
</script>

<style lang="scss" scoped>
// Give the PageLayout demo a full-bleed canvas: the outer padding and the border
// around the content area move onto the side panel, so PageLayout renders edge to
// edge the way it does inside an app shell.
// `:deep` (rather than a plain unscoped block) keeps these one specificity step
// above SandboxLayout's own scoped rules, so they win regardless of style order.
.page-layout-sandbox-app {
  :deep(.kong-ui-sandbox-layout) {
    .layout {
      gap: var(--kui-space-0, $kui-space-0);
      padding: var(--kui-space-0, $kui-space-0);
    }

    .desktop-nav-container {
      border-right: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
      padding: var(--kui-space-70, $kui-space-70);
    }

    .sandbox-container {
      border: none;
      border-radius: var(--kui-border-radius-0, $kui-border-radius-0);
      padding: var(--kui-space-0, $kui-space-0);
    }
  }

  .sandbox-control-list {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-60, $kui-space-60);
  }
}
</style>
