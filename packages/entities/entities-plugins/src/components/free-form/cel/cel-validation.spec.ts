import { describe, expect, it } from 'vitest'
import { getCelValidationRequest, parseCelCompileError } from './cel-validation'

describe('getCelValidationRequest', () => {
  it('sends an `expressions.*` twin as the expression to compile', () => {
    expect(getCelValidationRequest('expressions.custom_key', 'consumer.username')).toEqual({ expression: 'consumer.username' })
    expect(getCelValidationRequest('expressions.limit.0', '10')).toEqual({ expression: '10' })
  })

  it('sends the plugin condition as a condition', () => {
    expect(getCelValidationRequest('condition', 'http.method == "GET"')).toEqual({ condition: 'http.method == "GET"' })
  })

  it('sends ACL rules as conditions, since they must return a boolean', () => {
    expect(getCelValidationRequest('config.allow_when.0', 'principal.id == "x"')).toEqual({ condition: 'principal.id == "x"' })
    expect(getCelValidationRequest('config.tools.0.acl.deny_when.1', 'false')).toEqual({ condition: 'false' })
  })

  it('does not mistake a field merely named like the expressions root', () => {
    expect(getCelValidationRequest('config.expressions_enabled', 'true')).toEqual({ condition: 'true' })
  })
})

describe('parseCelCompileError', () => {
  it('reads the location koko reports and drops the prefix', () => {
    expect(parseCelCompileError('kcel: compile: ERROR: <input>:1:5: undeclared reference to \'foo\'')).toEqual({
      message: 'undeclared reference to \'foo\'',
      line: 1,
      // cel-go counts columns from 0, Monaco from 1.
      column: 6,
    })
  })

  it('reads a location on a later line', () => {
    expect(parseCelCompileError('ERROR: <input>:3:0: mismatched input \'<EOF>\'')).toEqual({
      message: 'mismatched input \'<EOF>\'',
      line: 3,
      column: 1,
    })
  })

  it('accepts a source name other than <input>', () => {
    expect(parseCelCompileError('ERROR: condition.cel:2:11: unexpected token')).toEqual({
      message: 'unexpected token',
      line: 2,
      column: 12,
    })
  })

  it('keeps only the error line, not the source echo and caret cel-go appends', () => {
    const message = [
      'kcel: compile: ERROR: <input>:1:14: undefined field \'methd\'',
      ' | http.request.methd == "GET"',
      ' | .............^',
    ].join('\n')

    expect(parseCelCompileError(message)).toEqual({
      message: 'undefined field \'methd\'',
      line: 1,
      column: 15,
    })
  })

  it('returns an unlocated message whole', () => {
    expect(parseCelCompileError('  expression must evaluate to a boolean  ')).toEqual({
      message: 'expression must evaluate to a boolean',
    })
  })

  it('returns the message whole when the location has nothing after it', () => {
    expect(parseCelCompileError('ERROR: <input>:1:5:')).toEqual({
      message: 'ERROR: <input>:1:5:',
    })
  })
})
