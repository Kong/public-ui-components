# Filler (test utilities)

Auto-fill utilities for Cypress and Playwright tests. A framework-agnostic core with framework-specific adapters — depends only on `form-schema.ts` and other generic primitives, no plugin/layout knowledge.

```
filler/
├── shared/       # field-walker (generator traversal), selectors (data-testid patterns), schema-utils
├── cypress/      # Cypress handlers for 11 field types
└── playwright/   # Playwright handlers (mirror structure)
```

Supported field types: string, number, boolean, enum, array, record, map, tag, json, foreign.

Usage:

```typescript
import { createFiller } from '@kong-ui-public/freeform/filler/cypress'

const filler = createFiller(schema)
filler.fill({ config: { host: 'localhost', port: 6379 } })
filler.fillField('config.host', 'example.com')
```

```typescript
import { createFiller } from '@kong-ui-public/freeform/filler/playwright'

const filler = createFiller(page, schema)
await filler.fill({ config: { host: 'localhost', port: 6379 } })
```

## Adding a New Field Type

1. Create `components/[Type]Field.vue` component
2. Add a case in `field-dispatch.ts`'s `resolveFieldComponent`
3. Add handler type in `filler/shared/field-walker.ts` (`HandlerType` enum)
4. Add Cypress handler in `filler/cypress/handlers/`
5. Add Playwright handler in `filler/playwright/handlers/`
6. Add selector support in `filler/shared/selectors.ts`
7. Add or update filler tests in `filler/cypress/fill-form.cy.ts` and `filler/playwright/fill-form.pw.ts`
