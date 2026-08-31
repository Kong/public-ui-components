# SecretInput.vue

`SecretInput` is a `KInput` wrapper for editable secrets. It masks with
`-webkit-text-security` on supported browsers, falls back to `type="password"`,
and provides an accessible reveal toggle.

```vue
<SecretInput
  v-model.trim="password"
  autocomplete="new-password"
  label="Password"
/>
```

The input is masked by default and `autocomplete` defaults to `off`. Pass
`v-model:masked` to control visibility. The `after` slot receives
`{ masked, toggle }` and renders alongside the built-in toggle; set
`show-mask-toggle="false"` when custom content should replace it. Ordinary
`KInput` attributes, listeners, model modifiers, and slots are forwarded.

Copy, cut, and drag are blocked while masked; paste remains available.
