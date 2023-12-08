<template>
  <div class="sandbox-container">
    <main>
      <KCard class="label-list-component">
        <template #title>
          Label List Component
        </template>
        <div id="kong-ui-app-layout-teleport-default-slot">
          <LabelList
            :can-edit="() => true"
            :labels="labels"
          />
        </div>
      </KCard>

      <KCard class="label-list-component">
        <template #title>
          Label Form Component
        </template>
        <LabelForm
          :model-value="labels"
          title="Test Label Form"
        />
      </KCard>
    </main>
  </div>
</template>

<script setup lang="ts">
import LabelForm from '../src/components/LabelForm.vue'
import LabelList from '../src/components/LabelList.vue'

import type { Label } from '../src/types'

const labels: Label[] = [
  {
    id: 'aa3db80f-b661-434e-bd7a-e6c561c3a15a',
    key: 'label-1',
    value: 'a-very-important-label-value-that-may-be-a-bit-too-long',
  },
  {
    id: 'aa3db80f-b661-434e-bd7a-e6c561c3a15b',
    key: 'label-2',
    value: 'label-2-value',
  },
  {
    id: 'aa3db80f-b661-434e-bd7a-e6c561c3a15c',
    key: 'label-3',
    value: 'label-3-value',
  },
]
</script>

<style lang="scss" scoped>
.sandbox-container {
  padding: $kui-space-60;

  .label-list-component {
    margin-bottom: $kui-space-80;
  }
}
</style>
