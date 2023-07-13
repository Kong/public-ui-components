<template>
  <div class="sandbox-container">
    <PageHeader
      :breadcrumbs="breadcrumbs"
      title="Cats are Cool"
    >
      <template #title-icon>
        <KIcon
          color="#169fcc"
          icon="graduationHat"
          size="20"
        />
      </template>
      <template #title-badge>
        <KBadge appearance="info">
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
    </PageHeader>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { PageHeader } from '../../src'

const breadcrumbs = computed(() => {
  return [
    {
      key: 'home',
      to: { name: 'home' },
      text: 'Home',
      icon: 'kong',
    },
  ]
})
const enabled = ref(false)
</script>

<style lang="scss" scoped>
.mr-3 {
  margin-right: 8px;
}

.actions-wrapper {
  display: flex;
  align-items: baseline;
}
</style>
