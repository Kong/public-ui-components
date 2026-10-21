<template>
  <div class="page-layout-sandbox-app">
    <SandboxLayout>
      <router-view />

      <template #navigation-after>
        <div class="sandbox-control-sections">
          <section class="sandbox-control-section">
            <h3 class="sandbox-control-heading">
              PageLayout
            </h3>

            <div class="sandbox-control-list">
              <KInputSwitch
                v-model="newAppearance"
                label="New appearance"
                label-before
              />
              <KInputSwitch
                v-model="showTabs"
                label="Tabs"
                label-before
              />
              <KInputSwitch
                v-model="showAnchorNavigation"
                label="Anchor navigation"
                label-before
              />
              <KInputSwitch
                v-model="showFavoriteButton"
                label="Favorite button"
                label-before
              />
              <KInputSwitch
                v-model="showTitleAfter"
                label="Title-after content"
                label-before
              />
              <KInputSwitch
                v-model="showAside"
                label="Aside content"
                label-before
              />
              <KInputSwitch
                v-model="showAskKaiButton"
                label="Ask Kai button"
                label-before
              />
            </div>
          </section>

          <section class="sandbox-control-section">
            <h3 class="sandbox-control-heading">
              AboutCard
            </h3>

            <div class="sandbox-control-list">
              <KInputSwitch
                v-model="aboutCardIsLoading"
                label="Loading"
                label-before
              />
            </div>
          </section>
        </div>
      </template>
    </SandboxLayout>
  </div>
</template>

<script setup lang="ts">
import { SandboxLayout } from '@kong-ui-public/sandbox-layout'
import { useSandboxControls } from './composables/useSandboxControls'

const { newAppearance, showTabs, showAnchorNavigation, showFavoriteButton, showTitleAfter, showAside, showAskKaiButton, aboutCardIsLoading } = useSandboxControls()
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

  .sandbox-control-sections {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-80, $kui-space-80);
  }

  .sandbox-control-heading {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-20, $kui-font-size-20);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    margin: var(--kui-space-0, $kui-space-0) var(--kui-space-0, $kui-space-0) var(--kui-space-50, $kui-space-50);
    text-transform: uppercase;
  }

  .sandbox-control-list {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-60, $kui-space-60);
  }
}
</style>
