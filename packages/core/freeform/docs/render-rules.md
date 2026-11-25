# Render Rules

Control field ordering and conditional visibility. Accepted by `Form` and `ObjectField`.

```typescript
interface RenderRules {
  // Group fields together and control ordering.
  // Each bundle is an array of field paths at the same nesting level.
  bundles?: string[][]

  // Show a field only when its dependency matches the expected value.
  // Field and dependency must be at the same nesting level.
  dependencies?: {
    [fieldPath: string]: [dependencyPath: string, expectedValue: any]
  }
}
```

Example:

```typescript
const renderRules: RenderRules = {
  bundles: [
    ['config.strategy', 'config.redis'],   // strategy and redis rendered together
  ],
  dependencies: {
    'config.redis': ['config.strategy', 'redis'],  // show redis only when strategy === 'redis'
  },
}
```

Constraints:
- Fields in the same bundle or dependency must be at the same nesting level.
- Circular references are not allowed (validated at runtime with helpful error messages).
