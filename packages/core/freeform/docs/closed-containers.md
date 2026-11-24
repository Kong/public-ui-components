# Closed Containers

Some containers unmount their content while closed, e.g. `KTabs` renders only the active panel, and a `v-if` takes a section out. The form can't see the fields in them: their errors are unmatched, and a reveal stops outside the container. A reveal adapter tells the form what a component does with fields, so it finds them before they mount. Try it in the sandbox's **Reveal containers** page.

```ts
import { KCollapse, KTabs } from '@kong/kongponents'
import { defineRevealAdapter, updateModelValue } from '@kong-ui-public/freeform'
import DebugSettings from './DebugSettings.vue'

// A container: a tab's panel is the slot named after its hash; `<hash>-anchor` is its label
defineRevealAdapter(KTabs, {
  contentSlots: slotName => !slotName.endsWith('-anchor'),
  open: ({ vnode, slotName }) => updateModelValue(vnode, `#${slotName}`),
})

// A container: `v-model` is whether it is collapsed; only the default slot collapses
defineRevealAdapter(KCollapse, {
  contentSlots: slotName => slotName === 'default',
  open: ({ vnode }) => updateModelValue(vnode, false),
})

// An opaque component: it renders these fields in its own template
defineRevealAdapter(DebugSettings, {
  fields: () => ['observability.log_level', 'observability.sample_rate'],
})
```

An adapter has these options. Set the ones that fit the component:

| Option | For | Detail |
|---|---|---|
| `contentSlots(slotName)` | A container | Whether a slot shows only while the container opens it, e.g. a tab's panel. The fields in its other slots always show |
| `open({ vnode, props, slotName })` | A container | Opens a content slot. Change view state only: usually call `updateModelValue(vnode, value)`, which calls the `onUpdate:modelValue` the parent binds. It warns when the parent binds no `v-model`, as there is then no state to set |
| `fields(props)` | An opaque component, which renders fields in its own template | The fields it renders. Name them as a `name` prop would: relative to the field around it, or absolute. Each is a path, or `{ path, exclude }` for a field that leaves out some children (as `omit` does) |
| `field(props)` | A field component | The field it renders. The fields in its default slot are relative to it. The built-in field components already have one |

| Rule | Detail |
|---|---|
| How the form finds fields | The form renders its default slot to vnodes, and the slots of each component in it, without mounting anything. It doesn't render a component's own template: the adapter says what that holds. A slot gets no slot props: one that needs them may throw, and then holds no field the form knows of. The form scans again when anything the content reads changes. `Form` exposes what it found as `revealTree` |
| Where to register | `defineRevealAdapter(component, adapter)` keys the adapter by the component object. Register it once, before the form renders: next to the component, or for a component of another library, in the host's entry (see `sandbox/reveal-adapters.ts`). An adapter for a component of another library depends on that library's slot names and `v-model` meaning, so test it when the library changes |
| Reveal | A reveal opens the containers on the way to the field, outermost first, with a render after each one. Then it goes on as before: records expand and array tabs switch |
| Errors | The fields of a closed container count as rendered, so their errors match. `Form` exposes `getContainerErrors({ component, key?, slotName? })`, which returns the errors of the fields in the containers it picks, e.g. to show a count on a tab. `key` is the container's vnode `key`; it tells containers of the same component apart. While the form scans, it returns `[]`, so the content can call it without a loop |
| Fields with no adapter | A field that unmounts (behind a plain `v-if`, or in a component with no adapter) is remembered. Its anchor is the field of `revealTree` closest to it on the page, as it mounted or else as it unmounted. The remembered field sits in its anchor's containers: its errors match and count there. A reveal opens those containers and lands where the field was, with `exact: false`. If opening them mounts the field again, the reveal lands on it, with `exact: true`. The memory lasts until the form unmounts, so a field that has not shown yet stays unmatched |
| Render rules | A field that render rules hide (it or an ancestor) isn't there for the current data. No container opens for it, and its memory is not used |
