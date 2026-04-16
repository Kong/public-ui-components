<template>
  <SplitPane
    :navigation-items="navItems"
    :pane-center="props.paneCenter"
    :pane-left="props.paneLeft"
    :pane-right="props.paneRight"
  >
    <template #toolbar>
      <SplitToolbar>
        <template #left>
          Left Toolbar
        </template>
        <template #center>
          Center Toolbar
        </template>
        <template #right>
          Right Toolbar
        </template>
      </SplitToolbar>
    </template>
    <template #pane-left>
      <KButton @click="toggleRightPane">
        toggle right pane
      </KButton>
    </template>
    <template #pane-center>
      <SplitToolbar />
      centre pane
    </template>
    <template #pane-right>
      right pane
    </template>
  </SplitPane>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowLeftIcon } from '@kong/icons'
import { SplitPane, SplitToolbar } from '../../src'
import type { SplitPaneProps, VerticalNavigationItem } from '../../src'

const showRightPane = ref<boolean>(true)

const props = computed<SplitPaneProps>(() => ({
  paneLeft: { visible: true },
  paneCenter: { visible: true },
  paneRight: { visible: !!showRightPane.value },
}))

const navItems = computed<VerticalNavigationItem[]>(() => [
  {
    active: false,
    icon: ArrowLeftIcon,
    testid: 'return',
    tooltip: 'Return to Home',
    to: '/',
  },
])

const toggleRightPane = () => {
  showRightPane.value = !showRightPane.value
}
</script>
