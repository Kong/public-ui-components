import type { ExpressionFieldSchema, FormSchema } from '../../form-schema'
import { defineCelLanguage } from '../../../../monaco-editor/src/languages/cel/catalog'
import { kongConsumer, kongHttp } from '../../../../monaco-editor/src/languages/cel/kong'

export const language = defineCelLanguage([kongHttp(), kongConsumer()])

export const schema: FormSchema = {
  type: 'record',
  fields: [
    { rule: { type: 'cel', language } },
    { condition: { type: 'string' } },
    { config: { type: 'record', required: true, fields: [
      { minute: { type: 'number', expressible: true } },
      { allow_when: { type: 'array', elements: { type: 'string' } } },
      { deny_when: { type: 'array', elements: { type: 'string' } } },
    ] } },
    { expressions: { type: 'record', fields: [
      { minute: { type: 'string', expressible_kong_type: 'number', source_field: { type: 'number' } } as ExpressionFieldSchema },
    ] } },
  ],
}

export const expression = 'http.path in ["/café", "/{enter}"]\n ? 10\n : 20'
export const condition = 'http.headers["x-team"] == "{backspace}"\n && http.path == "/雪"'
export const acl = 'consumer.username == "{enter}雪"\n && consumer.id != ""'

// Monaco uses the browser platform's line endings for multiline models.
export function parsePayload(text: string) {
  return JSON.parse(text, (_, value) => typeof value === 'string' ? value.replaceAll('\r\n', '\n') : value)
}
