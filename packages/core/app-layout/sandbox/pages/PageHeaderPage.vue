<template>
  <div class="sandbox-container">
    <AppPageHeader
      :breadcrumbs="breadcrumbs"
      :konnect-navigation-next="konnectNavigationNextEnabled"
      title="Cats are Cool"
    >
      <template #icon-app-layout>
        <KongIcon :color="KUI_COLOR_TEXT_DECORATIVE_AQUA" />
      </template>
      <template #title-before>
        <TeamIcon class="title-icon" />
      </template>
      <template #title-after>
        <KBadge appearance="neutral">
          TRUTH
        </KBadge>
      </template>

      <template #actions>
        <div class="actions-wrapper">
          <KInputSwitch
            v-model="konnectNavigationNextEnabled"
            label="Konnect navigation next"
            label-before
          />
          <KButton appearance="primary">
            <AddIcon />
            Do Things
          </KButton>
        </div>
      </template>

      <template #below>
        <div>
          Cats are a key part of a balanced day (except when walking down stairs)
        </div>
      </template>
    </AppPageHeader>

    <AppAboutSection
      created="2023-02-17"
      description="Some cats are cool, some are not. This one is cool."
      modified="2023-02-17 15:23:34"
    >
      <template #title>
        About this cat
        <KBadge>Meow!</KBadge>
      </template>

      <template #actions>
        <EditIcon
          color="#0044f4"
          role="button"
          :size="20"
        />
      </template>

      <div>
        <span class="badge-label">Name:</span>
        <KBadge appearance="neutral">
          TK
        </KBadge>
      </div>
      <div>
        <span class="badge-label">Color:</span>
        <KBadge appearance="neutral">
          BLACK
        </KBadge>
      </div>
      <div>
        <span class="badge-label">Type:</span>
        <KBadge appearance="success">
          COOL
        </KBadge>
      </div>
      <div class="method-badges">
        <span class="badge-label">Methods:</span>
        <KBadge
          v-for="method in ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace', 'connect', 'custom']"
          :key="method"
          :appearance="(method as BadgeMethodAppearance)"
        />
      </div>

      <template #divider-section>
        <div>
          This cat has a habit of sleeping in uncomfortable looking positions.
        </div>
        <div>
          <KButton appearance="tertiary">
            🍔
            I can haz cheezeburger
          </KButton>
        </div>
        <hr>
        <div>
          I have a lot to say about cats.
        </div>
      </template>
    </AppAboutSection>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { BadgeMethodAppearance } from '@kong/kongponents'
import { AppAboutSection, AppPageHeader } from '../../src'
import { EditIcon, KongIcon, TeamIcon, AddIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_DECORATIVE_AQUA } from '@kong/design-tokens'

const breadcrumbs = computed(() => {
  return [
    {
      key: 'app-layout',
      to: { name: 'home' },
      text: 'App Layout',
    },
    {
      key: 'app-page-header',
      to: { name: 'page-header' },
      text: 'App Page Header',
    },
  ]
})
const konnectNavigationNextEnabled = ref<boolean>(false)
</script>

<style lang="scss" scoped>
.sandbox-container {
  padding: 16px;
}

.home-breadcrumb-icon {
  align-self: center;
  display: inline-flex;
  margin-right: 8px;
}

.title-icon {
  display: inline-flex;
}

.mr-3 {
  margin-right: 8px;
}

.actions-wrapper {
  align-items: center;
  display: flex;
  gap: $kui-space-50;
}

.about-action-button {
  display: flex;
}

.badge-label {
  font-size: 12px;
  line-height: 20px;
  margin-right: 8px;
}

.method-badges {
  column-gap: 4px;
  display: flex;
  flex-wrap: wrap;
  row-gap: 8px;
}
</style>
