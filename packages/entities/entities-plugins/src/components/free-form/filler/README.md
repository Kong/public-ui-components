# Freeform Filler

Auto-fill FreeForm forms in Cypress and Playwright tests based on schema definitions.

## Usage

### Cypress

```typescript
import { createFiller } from '@kong-ui-public/entities-plugins/filler/cypress'

const filler = createFiller(schema)

// Fill entire form
filler.fill({
  name: 'my-plugin',
  enabled: true,
  timeout: 5000,
})

// Fill single field
filler.fillField('name', 'my-plugin')
```

### Playwright

```typescript
import { createFiller } from '@kong-ui-public/entities-plugins/filler/playwright'

const filler = createFiller(page, schema)

await filler.fill({
  name: 'my-plugin',
  enabled: true,
})
```

## Examples

**Nested records:**
```typescript
filler.fill({
  config: {
    host: 'localhost',
    port: 6379,
  },
})
```

**Arrays:**
```typescript
filler.fillField('hosts', ['host1.com', 'host2.com'])
filler.fillField('servers', [
  { host: 'localhost', port: 8080 },
  { host: '127.0.0.1', port: 3000 },
])
```

**Enums and tags:**
```typescript
filler.fillField('policy', 'redis')                           // Single-select
filler.fillField('protocols', ['http', 'https'])              // Multi-select
filler.fillField('tags', ['production', 'v1'])                // Tags
```

**Maps:**
```typescript
filler.fillField('headers', {
  'Content-Type': 'application/json',
})
```

## API

**`createFiller(schema)`** / **`createFiller(page, schema)`**
Creates a filler instance.

**`filler.fill(data)`**
Fills entire form. Skips `undefined` values.

**`filler.fillField(fieldKey, value, options?)`**
Fills a single field. Use dot notation for nested fields: `'config.timeout'`, `'servers.0.host'`.

## Development

### Structure

```
filler/
├── shared/           # Framework-agnostic (types, selectors, utilities)
├── cypress/          # Cypress handlers
└── playwright/       # Playwright handlers
```

### Adding a Field Type

1. Add selector in `shared/selectors.ts`
2. Implement handler in `cypress/handlers/` and `playwright/handlers/`
3. Update `getHandlerType()` in `shared/field-walker.ts`
4. Add case in `fillFieldByInfo()` in both `create-filler.ts` files

### Testing

```bash
pnpm test:component:open
```

See `fill-form.cy.ts` for test examples.
