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
        <KBadge
          appearance="neutral"
          shape="rectangular"
        >
          TRUTH
        </KBadge>
      </template>

      <template #actions>
        <div class="actions-wrapper">
          <KInputSwitch
            v-model="enabled"
            class="mr-3"
            :label="enabled ? 'Enabled' : 'Disabled'"
            label-position="left"
          />
          <KButton
            appearance="creation"
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
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { AppPageHeader } from '../../src'

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
  margin-right: 8px;
  align-self: center;
  display: inline-flex;
}

.title-icon {
  display: inline-flex;
}

.mr-3 {
  margin-right: 8px;
}

.actions-wrapper {
  display: flex;
  align-items: baseline;
}
</style>
