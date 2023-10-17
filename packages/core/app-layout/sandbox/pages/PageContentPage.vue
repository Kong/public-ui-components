<template>
  <div class="sandbox-container">
    <AppPageContent>
      <AppPageHeader
        :breadcrumbs="breadcrumbs"
        title="Cats are Cool"
      >
        <template #icon-home>
          <KIcon
            class="home-breadcrumb-icon"
            color="#169fcc"
            icon="immunity"
            size="16"
          />
        </template>

        <template #actions>
          <KButton
            appearance="creation"
            icon="plus"
          >
            Do Things
          </KButton>
        </template>
      </AppPageHeader>

      <AppAboutSection
        created="2023-02-17"
        description="Some cats are cool, some are not. This one is cool."
        modified="2023-02-17 15:23:34"
        title="About this Cat"
      >
        <div>
          <span class="badge-label">Name:</span>
          <KBadge
            appearance="neutral"
            shape="rectangular"
          >
            TK
          </KBadge>
        </div>
        <div class="method-badges">
          <span class="badge-label">Methods:</span>
          <KMethodBadge
            v-for="method in ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace', 'connect', 'custom']"
            :key="method"
            :method="(method as Method)"
          />
        </div>
      </AppAboutSection>

      <KCard>
        <template #body>
          Section 1
        </template>
      </KCard>

      <KCard>
        <template #body>
          Section 2
        </template>
      </KCard>

      <form class="app-page-content-container bordered">
        <div>I have to have a parent, so my parent gets a class of `.app-page-content-container`</div>
        <div>I am the correct distance from my sibling div above</div>
      </form>

      <div class="app-page-content-container bordered">
        My grandchildren need a parent who can use `flex-direction: row`, so I get a class of `.app-page-content-container`.

        <div class="horizontal-content">
          <div>Left</div>
          <div>Right</div>
        </div>

        <div class="horizontal-content">
          <div>Left_2</div>
          <div>Right_2</div>
        </div>
      </div>

      <div class="bordered">
        <div class="display-contents">
          <div class="app-page-content-section">
            My parent uses `display: contents`, so it can't use `.app-page-content-container`. All us children have to use `.app-page-content-section` for our bottom margin.
          </div>

          <div>
            <div class="app-page-content-section">I am a deeply nested child div (with class `.app-page-content-section`)</div>
          </div>

          <div>
            <div>Well, I don't need `.app-page-content-section` because I'm the last child!</div>
          </div>
        </div>
      </div>

      <div class="bordered">Plain old div here</div>
    </AppPageContent>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Method } from '@kong/kongponents'
import { AppAboutSection, AppPageHeader, AppPageContent } from '../../src'

const breadcrumbs = computed(() => {
  return [
    {
      key: 'home',
      to: { name: 'home' },
      text: 'Home',
    },
  ]
})
</script>

<style lang="scss" scoped>
.sandbox-container {
  padding: 16px;
}

.display-contents {
  display: contents;
}

.bordered {
  border: 1px solid rgba(0, 0, 0, .1);
  border-radius: 4px;
  padding: 12px;
}

.horizontal-content {
  display: flex;
  flex-direction: row;
  justify-content: space-around;
  row-gap: 20px;
  width: 100%;
}

.home-breadcrumb-icon {
  align-self: center;
  display: inline-flex;
  margin-right: 8px;
}

.badge-label {
  font-size: 12px;
  line-height: 20px;
  margin-right: 8px;
}

.method-badges {
  display: flex;
  flex-wrap: wrap;
  column-gap: 4px;
  row-gap: 8px;
}
</style>
