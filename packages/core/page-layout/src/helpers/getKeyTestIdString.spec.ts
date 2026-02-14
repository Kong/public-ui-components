import { describe, it, expect } from 'vitest'
import getKeyTestIdString from './getKeyTestIdString'

describe('getKeyTestIdString', () => {
  it('converts camelCase to kebab-case', () => {
    expect(getKeyTestIdString('apiGateway')).toBe('api-gateway')
    expect(getKeyTestIdString('myTestString')).toBe('my-test-string')
  })

  it('converts PascalCase to kebab-case', () => {
    expect(getKeyTestIdString('ApiGateway')).toBe('api-gateway')
    expect(getKeyTestIdString('MyTestString')).toBe('my-test-string')
  })

  it('converts SNAKE_CASE to kebab-case', () => {
    expect(getKeyTestIdString('API_GATEWAY')).toBe('api-gateway')
    expect(getKeyTestIdString('MY_TEST_STRING')).toBe('my-test-string')
  })

  it('handles consecutive uppercase letters', () => {
    expect(getKeyTestIdString('APIGateway')).toBe('api-gateway')
    expect(getKeyTestIdString('HTTPServer')).toBe('http-server')
    expect(getKeyTestIdString('XMLParser')).toBe('xml-parser')
  })

  it('handles strings with numbers', () => {
    expect(getKeyTestIdString('api2Gateway')).toBe('api2-gateway')
    expect(getKeyTestIdString('test123String')).toBe('test123-string')
  })

  it('returns lowercase string unchanged', () => {
    expect(getKeyTestIdString('gateway')).toBe('gateway')
  })

  it('returns already kebab-case string unchanged', () => {
    expect(getKeyTestIdString('api-gateway')).toBe('api-gateway')
  })

  it('handles single character string', () => {
    expect(getKeyTestIdString('a')).toBe('a')
    expect(getKeyTestIdString('A')).toBe('a')
  })

  it('handles empty string', () => {
    expect(getKeyTestIdString('')).toBe('')
  })
})
