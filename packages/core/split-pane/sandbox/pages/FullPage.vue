<template>
  <SplitPane
    :navigation-items="navItems"
    :pane-center="props.paneCenter"
    :pane-left="props.paneLeft"
    :pane-right="props.paneRight"
  >
    <template #pane-left>
      left
    </template>
    <template #pane-center>
      centre
    </template>
    <template #pane-right>
      right
    </template>
  </SplitPane>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { SplitPane, type SplitPaneProps, type VerticalNavigationItem } from '../../src'
import { ArrowLeftIcon } from '@kong/icons'

const props = computed((): SplitPaneProps => ({
  paneLeft: { visible: true },
  paneCenter: { visible: true },
  paneRight: { visible: true },
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
</script>
