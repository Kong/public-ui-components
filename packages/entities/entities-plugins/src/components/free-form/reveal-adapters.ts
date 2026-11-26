import { KTabs } from '@kong/kongponents'
import { defineRevealAdapter, updateModelValue } from '@kong-ui-public/freeform'
import FieldControl from './components/FieldControl.vue'

// Tell the form which fields the containers of the plugin forms hold, so a reveal and the
// field errors reach them while they are closed. See freeform's `docs/closed-containers.md`.

// `KTabs` mounts only the active panel. A tab's panel is the slot named after its hash;
// `<hash>-anchor` is its label. `v-model` is the active hash.
defineRevealAdapter(KTabs, {
  contentSlots: slotName => !slotName.endsWith('-anchor'),
  open: ({ vnode, slotName }) => updateModelValue(vnode, `#${slotName}`),
})

// `FieldControl` makes the control in its slot the field at `name`, except what it `exclude`s
defineRevealAdapter<{ name: string, exclude?: string[] }>(FieldControl, {
  field: props => ({ path: props.name, exclude: props.exclude }),
})
