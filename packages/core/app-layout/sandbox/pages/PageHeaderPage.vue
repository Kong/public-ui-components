<template>
  <div class="sandbox-container">
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
      <template #title-before>
        <KIcon
          class="title-icon"
          color="#169fcc"
          icon="graduationHat"
          size="20"
        />
      </template>
      <template #title-after>
        <KBadge appearance="neutral">
          TRUTH
        </KBadge>
      </template>

      <template #actions>
        <div class="actions-wrapper">
          <KInputSwitch
            v-model="enabled"
            class="actions-switch"
            :label="enabled ? 'Enabled' : 'Disabled'"
            label-before
          />
          <KButton
            appearance="primary"
            icon="plus"
          >
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
      title="About this Cat"
    >
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
        <KMethodBadge
          v-for="method in ['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace', 'connect', 'custom']"
          :key="method"
          :method="(method as Method)"
        />
      </div>

      <template #divider-section>
        <div>
          This cat has a habit of sleeping in uncomfortable looking positions.
        </div>
        <div>
          <KButton appearance="tertiary">
            <template #icon>
              🍔
            </template>
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
import type { Method } from '@kong/kongponents'
import { AppAboutSection, AppPageHeader } from '../../src'
import { EditIcon } from '@kong/icons'

const breadcrumbs = computed(() => {
  return [
    {
      key: 'home',
      to: { name: 'home' },
      text: 'Home',
    },
  ]
})
const enabled = ref(false)
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
  align-items: baseline;
  display: flex;
}

.actions-switch {
  margin-right: 12px;
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
