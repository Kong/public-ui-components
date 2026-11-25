# Field Navigation

`Form` exposes `reveal(path)`, which brings the field at a data path into view and focuses it, even when it sits in a collapsed record or an inactive array tab. Try it in the sandbox's **Field navigation** page.

```ts
const result = await formRef.value?.reveal('config.redis.host')
// { path: 'config.redis.host', exact: true }
```

| Rule | Detail |
|---|---|
| Path format | Real map keys, dot separated, array indexes as `.1`. A segment with `.`, `[`, `]` or `"` in it (or an empty key) is a quoted bracket segment: `config.headers["x.y"]`. `parseDataPath`/`formatDataPath` convert between a path and its segments; `limits[1]` is also accepted |
| Only view state changes | Records expand and array tabs switch. A record that is switched off is not switched on, and a field hidden by a render rule stays hidden: the reveal stops at the nearest visible ancestor and returns it with `exact: false` |
| Result | `null` when nothing on the path is visible, the path is malformed, or a later `reveal` call took over |
| Animation | `reveal(path, { duration, highlight })`. The scroll eases to the field in `duration` ms (default `300`; `0` jumps there at once). With `highlight` (default `true`) the field then flashes for twice the scroll, or 600 ms when the jump is not animated; the style is the global `ff-reveal-highlight` class. Users who prefer reduced motion get an instant jump and no flash |

The field names in an entity checks alert (`EntityChecksAlert`, shown at the top of a record) are links that reveal the field, resolved against the record's path, e.g. `redis.host` on `config` reveals `config.redis.host`.

A custom container opens itself for a reveal through `useField(name).revealTarget`: the path being revealed while it is the field itself or inside it, `null` otherwise.

A section that is not a field path but keeps its fields mounted while closed (e.g. `KCollapse`, which uses `v-show`) opens itself with `useRevealOpen(container, open)`: `open` is called when the field that renders the target is inside `container`. The form knows which field that is because every mounted field registers itself, and a record split with `omit` covers only the fields it renders. Try it in the sandbox's **Split fields** page. A section that unmounts its fields while closed is not supported.
