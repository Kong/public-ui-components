import { describe, it, expect } from 'vitest'
import { luaSchemaToZod } from './index'
import acl from '../../../fixtures/schemas/acl'
import aiProxy from '../../../fixtures/schemas/ai-proxy'
import cors from '../../../fixtures/schemas/cors'
import entitlementEnforcement from '../../../fixtures/schemas/entitlement-enforcement'
import mocking from '../../../fixtures/schemas/mocking'
import nestedMixed from '../../../fixtures/schemas/nested-mixed'
import oidc from '../../../fixtures/schemas/oidc'
import opentelemetry from '../../../fixtures/schemas/opentelemetry'
import rateLimiting from '../../../fixtures/schemas/rate-limiting'

// `free-form-mocking.ts` exports test-case builder functions, not a
// `FormSchema` itself, so it's not a fixture for this compiler.
const all = { acl, aiProxy, cors, entitlementEnforcement, mocking, nestedMixed, oidc, opentelemetry, rateLimiting }

describe('smoke: compile every fixture without throwing', () => {
  for (const [name, schema] of Object.entries(all)) {
    it(`compiles ${name}`, () => {
      expect(() => luaSchemaToZod(schema as any)).not.toThrow()
    })
  }
})
