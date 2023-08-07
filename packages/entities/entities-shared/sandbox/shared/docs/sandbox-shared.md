# Sandbox shared utilities

The individual entities sandboxes all share some common components/utilities which lives in the `/packages/entities/entities-shared/sandbox/shared` folder. Those components **are not** getting exported by `entities-shared` package and are only available in "dev" environment.

## Importing

The shared sandbox components/utilities are available for import via a built-in alias `@entities-shared-sandbox` that you can use to import individual components/helpers/etc.

Example:
```ts
import SandboxPermissionsControl from '@entities-shared-sandbox/components/SandboxPermissionsControl.vue'
```

## Individual Components

### SandboxPermissionsControl

Component that helps control permissions for individual entities. Using inputs and switch toggles, allows to enable/disable permissions for each of the apps manually.

#### events

- `update` - event is emitted when any of the manual permission controls are toggled.

Emitted object:
```ts
{
  canCreate: () => Promise<boolean>,
  canDelete: (row: Record<string, any>) => Promise<boolean>,
  canEdit: (row: Record<string, any>) => Promise<boolean>,
  canRetrieve: (row: Record<string, any>) => Promise<boolean>
}
```