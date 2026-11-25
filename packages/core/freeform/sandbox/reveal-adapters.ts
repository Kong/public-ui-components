import { KCollapse, KTabs } from '@kong/kongponents'
import { defineRevealAdapter, updateModelValue } from '../src'
import DebugSettings from './components/DebugSettings.vue'

// A tab's panel is the slot named after its hash; `<hash>-anchor` is its label
defineRevealAdapter(KTabs, {
  contentSlots: slotName => !slotName.endsWith('-anchor'),
  open: ({ vnode, slotName }) => updateModelValue(vnode, `#${slotName}`),
})

// `v-model` is whether it is collapsed; only the default slot collapses
defineRevealAdapter(KCollapse, {
  contentSlots: slotName => slotName === 'default',
  open: ({ vnode }) => updateModelValue(vnode, false),
})

defineRevealAdapter(DebugSettings, {
  fields: () => ['observability.log_level', 'observability.sample_rate'],
})
