import { describe, it, expect } from 'vitest'
import { getManagedByLabel, getManagedByOwner, CUSTOM_OWNER_LABEL } from './managed-by'

describe('getManagedByOwner', () => {
  it('reads external owners from `tool`', () => {
    expect(getManagedByOwner({ tool: 'deck', version: '1.49.1' })).toBe('deck')
  })

  it('reads Konnect owners from `service`', () => {
    expect(getManagedByOwner({ service: 'ai-manager' })).toBe('ai-manager')
  })

  it('prefers `service` over `tool`', () => {
    expect(getManagedByOwner({ service: 'ai-manager', tool: 'deck' })).toBe('ai-manager')
  })

  it.each([
    ['undefined', undefined],
    ['null', null],
    ['an empty object', {}],
    ['blank values', { tool: '', service: '' }],
  ])('returns null for %s', (_label, value) => {
    expect(getManagedByOwner(value as any)).toBeNull()
  })
})

describe('getManagedByLabel', () => {
  it.each([
    ['terraform-provider-konnect', 'Terraform'],
    ['deck', 'decK'],
    ['kong-gateway-operator', 'Kong Gateway Operator'],
    ['gw-manager', 'Konnect UI'],
    ['dev-portal', 'Dev Portal'],
  ])('maps the known tool %s to %s', (tool, expected) => {
    expect(getManagedByLabel({ tool })).toBe(expected)
  })

  it('maps known services', () => {
    expect(getManagedByLabel({ service: 'ai-manager' })).toBe('AI Manager')
  })

  it.each([
    'kong-ingress-controller',
    'some-tool-we-have-never-seen',
  ])('falls back to the custom label for the unmapped owner %s', (tool) => {
    expect(getManagedByLabel({ tool })).toBe(CUSTOM_OWNER_LABEL)
  })

  it('returns null when there is no owner, so callers render their own empty state', () => {
    expect(getManagedByLabel(null)).toBeNull()
    expect(getManagedByLabel(undefined)).toBeNull()
    expect(getManagedByLabel({})).toBeNull()
  })

  it('ignores the non-owner metadata fields', () => {
    expect(getManagedByLabel({
      tool: 'terraform-provider-konnect',
      version: 'v2.12.0',
      repository: 'github.com/kong/terraform-provider-konnect',
      workspace: 'production',
    })).toBe('Terraform')
  })
})
