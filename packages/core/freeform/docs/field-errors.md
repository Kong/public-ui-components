# Field Errors

`Form` takes `errors`, a list of `{ path, message }` with data paths in the [Field Navigation](field-navigation.md) format, and shows each one under the field it belongs to. Try it in the sandbox's **Field errors** page.

```vue
<Form v-model:errors="errors" :schema="schema" :data="data" />
<!-- errors: [{ path: 'config.redis.host', message: 'required field missing' }] -->
```

| Rule | Detail |
|---|---|
| Display only | The form shows the errors, and drops them as the data changes (see below). Turning a server response into `errors`, and when to set or clear all of them, is up to the host. Showing errors and revealing fields are separate: a host that lists the errors can call `reveal(error.path)` when one is clicked |
| Where an error shows | A field shows its own errors. A record, array or map shows only errors on itself, never a count of the ones inside. A set or a JSON field is one field, so it also shows the errors of its items (`tags.1`) |
| Structure changes | An error belongs to the item it was raised on, not to its index. When an array item or a map entry is removed through the form, its errors are dropped and the errors of later array items move to their new index; when a map key is renamed, its errors follow it. The form emits the new list through `update:errors`, so bind `v-model:errors` |
| Value changes | An error goes once the value of a field it is about changes, whatever the new value is. By default an error is about the field at its `path`, and everything inside it; set `fields` to the data paths of other fields instead, e.g. the fields an entity check names. An error inside a set or a JSON value is about the whole field. A new error keeps the values as they are when it arrives, so set errors that match the current data. The form emits the new list through `update:errors` |
| Unmatched errors | An error no field can show in the current state — its path is malformed or not in the schema, names a map key that isn't in the data, sits under a record or array item without a value, is hidden by a render rule, or is rendered by no mounted field (e.g. every record that could show it leaves it out with `omit`) — is left out of the form and listed in the exposed `unmatchedErrors`, for the host to show elsewhere |

A custom field component gets its errors from `useField(name)`: `fieldErrors` (its own and those below it), `ownFieldErrors`, and `fieldErrorMessage` (`fieldErrors` as one line). The `FieldErrors` component renders a list of them.
