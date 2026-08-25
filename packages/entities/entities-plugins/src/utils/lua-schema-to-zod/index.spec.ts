import { describe, expect, it } from 'vitest'
import { compileFieldCompat, compileSchemaCompat } from './compile-compat'
import { compileFieldStrict, compileSchemaStrict } from './compile-strict'
import { compileField, luaSchemaToZod } from './index'

// `strict`/`compat` themselves are tested in compile-strict.spec.ts and
// compile-compat.spec.ts. This just checks that the public API (what any
// real caller actually imports) routes to the right one of the two.
describe('luaSchemaToZod / compileField (public API dispatch)', () => {
  const schema = { fields: [{ name: { type: 'string' as const, required: true } }] }

  it('defaults to strict mode', () => {
    expect(luaSchemaToZod(schema).safeParse({}).success)
      .toBe(compileSchemaStrict(schema).safeParse({}).success)
  })

  it('routes to the strict compiler when asked explicitly', () => {
    expect(luaSchemaToZod(schema, 'strict').safeParse({}).success)
      .toBe(compileSchemaStrict(schema).safeParse({}).success)
  })

  it('routes to the compat compiler', () => {
    expect(luaSchemaToZod(schema, 'compat').safeParse({}).success)
      .toBe(compileSchemaCompat(schema).safeParse({}).success)
  })

  it('compileField defaults to strict mode', () => {
    const field = schema.fields[0].name
    expect(compileField(field, 'name').safeParse(undefined).success)
      .toBe(compileFieldStrict(field, 'name').safeParse(undefined).success)
  })

  it('compileField routes to the compat compiler', () => {
    const field = schema.fields[0].name
    expect(compileField(field, 'name', 'compat').safeParse(undefined).success)
      .toBe(compileFieldCompat(field, 'name').safeParse(undefined).success)
  })
})
