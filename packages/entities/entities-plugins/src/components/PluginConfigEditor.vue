<template>
  <div>
    <div class="plugin-config-editor-toolbar">
      <KSegmentedControl
        v-model="language"
        class="language-control"
        :options="languageOptions"
      />
    </div>

    <div
      ref="editorRef"
      class="plugin-config-editor-editor"
    />
  </div>
</template>

<script setup lang="ts">
import { configureMonacoYaml } from '@kong/monaco-yaml'
import cloneDeep from 'lodash-es/cloneDeep'
import * as monaco from 'monaco-editor'
import { type JSONSchema } from 'vscode-json-languageservice'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import YAML from 'yaml'
import {
  isArrayLikeField,
  isBooleanField,
  isMapField,
  isNumberLikeField,
  isRecordField,
  isStringField,
  type ArrayLikeFieldSchema,
  type BooleanFieldSchema,
  type FieldSchema,
  type MapFieldSchema,
  type NumberLikeFieldSchema,
  type RecordFieldSchema,
  type StringFieldSchema,
} from '../types'

interface ExtendedJSONSchema extends JSONSchema {
  detail?: string;
}

const languageOptions = [
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
]

const language = ref<'json' | 'yaml'>('json')

const editorRef = ref<HTMLElement | null>(null)
let editor: monaco.editor.IStandaloneCodeEditor
let jsonModel: monaco.editor.ITextModel
let yamlModel: monaco.editor.ITextModel

const props = defineProps<{
  schema: any;
}>()

const luaPatternToRePattern = (luaPattern: string) => {
  return luaPattern
    .replace(/%a/g, '[A-Za-z]') // %a -> letters
    .replace(/%d/g, '\\d') // %d -> digits
    .replace(/%l/g, '[a-z]') // %l -> lower case letters
    .replace(/%p/g, '[!"#$%&\'()*+,\\-./:;<=>?@[\\]^_`{|}~]') // %p -> punctuation characters
    .replace(/%s/g, '\\s') // %s -> space characters
    .replace(/%u/g, '[A-Z]') // %u -> upper case letters
    .replace(/%w/g, '\\w') // %w -> alphanumeric characters
    .replace(/%x/g, '[0-9A-Fa-f]') // %x -> hexadecimal digits
    // magic characters: ( ) . % + - * ? [ ^ $
    .replace(/%\(/g, '\\(') // %( -> literal (
    .replace(/%\)/g, '\\)') // %) -> literal )
    .replace(/%\./g, '\\.') // %. -> literal .
    .replace(/%\+/g, '\\+') // %+ -> literal +
    .replace(/%-/g, '\\-') // %- -> literal -
    .replace(/%\*/g, '\\*') // %* -> literal *
    .replace(/%\?/g, '\\?') // %? -> literal ?
    .replace(/%\[/g, '\\[') // %[ -> literal [
    .replace(/%\^/g, '\\^') // %^ -> literal ^
    .replace(/%\$/g, '\\$') // %$ -> literal $
    .replace(/%%/g, '%') // %% -> literal %
}

const unescapeRePattern = (rePattern: string) => rePattern.replace(/\\(.)/g, '$1')

const buildStringSchema = (fieldSchema: StringFieldSchema): ExtendedJSONSchema => {
  const schema: ExtendedJSONSchema = {
    type: 'string',
  }

  if (fieldSchema.len_eq !== undefined) {
    schema.minLength = fieldSchema.len_eq
    schema.maxLength = fieldSchema.len_eq
  } else {
    schema.minLength = fieldSchema.len_min
    schema.maxLength = fieldSchema.len_max
  }

  if (fieldSchema.one_of !== undefined) {
    schema.enum = fieldSchema.one_of
  }

  const allOf: ExtendedJSONSchema['allOf'] = []

  if (fieldSchema.match !== undefined) {
    allOf.push({
      pattern: luaPatternToRePattern(fieldSchema.match),
      $comment: 'source: match',
    })
  }

  if (fieldSchema.match_none) {
    allOf.push(...fieldSchema.match_none.map((rule) =>{
      const pattern = luaPatternToRePattern(rule.pattern)
      return {
        errorMessage: rule.err,
        not: {
          pattern,
        },
        $comment: 'source: match_none',
      }
    }))
  }

  if (fieldSchema.match_any) {
    allOf.push({
      errorMessage: fieldSchema.match_any.err,
      anyOf:fieldSchema.match_any.patterns.map((pattern) => ({
        pattern: luaPatternToRePattern(pattern),
      })),
      $comment: 'source: match_any',
    })
  }

  if (fieldSchema.match_all) {
    allOf.push(...fieldSchema.match_all.map((rule) => {
      const pattern = luaPatternToRePattern(rule.pattern)
      return {
        errorMessage: rule.err,
        pattern,
        $comment: 'source: match_all',
      }
    }))
  }

  if (allOf.length > 0) {
    schema.allOf = allOf
  }

  return schema
}

const buildNumberLikeSchema = (fieldSchema: NumberLikeFieldSchema): ExtendedJSONSchema => {
  const schema: ExtendedJSONSchema = {
    type: 'number',
  }

  schema.minimum = fieldSchema.between?.[0]
  schema.maximum = fieldSchema.between?.[1]

  if (typeof fieldSchema.gt === 'number' && !Number.isNaN(fieldSchema.gt)) {
    if (typeof schema.minimum !== 'number' || fieldSchema.gt > schema.minimum) {
      schema.minimum = fieldSchema.gt
    }
  }

  if (fieldSchema.one_of !== undefined) {
    schema.enum = fieldSchema.one_of
  }

  return schema
}

const buildBooleanSchema = (fieldSchema: BooleanFieldSchema): ExtendedJSONSchema => {
  return {
    type: 'boolean',
  }
}

const buildArrayLikeSchema = (name: string, fieldSchema: ArrayLikeFieldSchema): ExtendedJSONSchema => {
  return {
    type: 'array', // JSON schema does not have a specific type for "set"
    items: buildAnySchema(name, fieldSchema.elements),
  }
}

const buildMapSchema = (fieldSchema: MapFieldSchema): ExtendedJSONSchema => {
  const patternProperties: JSONSchema['patternProperties'] = {}
  if (isStringField(fieldSchema.keys) && fieldSchema.keys.match_none) {
    for (const rule of fieldSchema.keys.match_none) {
      patternProperties[luaPatternToRePattern(rule.pattern)] = { not: {} }
    }
  }
  patternProperties['.*'] = buildAnySchema('value', fieldSchema.values)

  return {
    type: 'object',
    additionalProperties: true,
    patternProperties,
  }
}

const buildUnknownSchema = (fieldSchema: FieldSchema): ExtendedJSONSchema => {
  return {
    detail: 'unknown',
    markdownDescription: 'Unknown field type',
  }
}

const buildRecordSchema = (fieldSchema: RecordFieldSchema): ExtendedJSONSchema => {
  const properties: Record<string, JSONSchema> = {}
  const required: string[] = []

  for (const namedChildField of fieldSchema.fields) {
    const [name, childField] = Object.entries(namedChildField)[0]
    properties[name] = buildAnySchema(name, childField)
    if (childField.required) {
      required.push(name)
    }
  }

  // TODO: Try replace with allOf
  // let anyOf: JSONSchema[] | undefined
  // if (Array.isArray(fieldSchema.entity_checks)) {
  //   for (const check of fieldSchema.entity_checks) {
  //     if (isAtLeastOneOfEntityCheck(check)) {
  //       if (!anyOf) {
  //         anyOf = []
  //       }
  //       anyOf.push(...check.at_least_one_of.map((name) => ({ required: [name] })))
  //     }
  //   }
  // }

  return {
    type: 'object',
    properties,
    // ...(required.length > 0 && { required }),
    // anyOf,
  }
}

const buildAnySchema = (name: string, fieldSchema: FieldSchema, options?: { yaml?: boolean }): ExtendedJSONSchema => {
  const markdownDescription = [
    ...fieldSchema.required ? ['_Required_'] : [],
    `Type: \`${fieldSchema.type}\``,
    fieldSchema.description,
    ...(fieldSchema.default ? [`Default: \`${JSON.stringify(fieldSchema.default)}\``] : []),
  ].join('\n\n')

  const commons: ExtendedJSONSchema = {
    // detail: `${fieldSchema.required ? '* ' : ''}${fieldSchema.type}`,
    default: fieldSchema.default,

    description: markdownDescription,
    markdownDescription,

    suggestSortText: `${fieldSchema.required ? ' ' : ''}${name}`,
  }

  if (isStringField(fieldSchema)) {
    return { ...commons, ...buildStringSchema(fieldSchema) }
  }

  if (isNumberLikeField(fieldSchema)) {
    return { ...commons, ...buildNumberLikeSchema(fieldSchema) }
  }

  if (isBooleanField(fieldSchema)) {
    return { ...commons, ...buildBooleanSchema(fieldSchema) }
  }

  if (isArrayLikeField(fieldSchema)) {
    return { ...commons, ...buildArrayLikeSchema(name, fieldSchema) }
  }

  if (isMapField(fieldSchema)) {
    return { ...commons, ...buildMapSchema(fieldSchema) }
  }

  if (isRecordField(fieldSchema)) {
    return { ...commons, ...buildRecordSchema(fieldSchema) }
  }

  console.warn(`Unknown field schema with type "${fieldSchema.type}": ${JSON.stringify(fieldSchema)}`)
  return { ...commons, ...buildUnknownSchema(fieldSchema) }
}

watch(
  () => props.schema,
  (schema) => {
    if (editor) {
      // schema always starts with a record in the root
      const jsonSchema = buildRecordSchema(cloneDeep(schema))
      console.log('translated JSON schema:', jsonSchema)

      // TODO: Update the schema in the editor
    }
  },
  { immediate: true },
)

const prepareData = (schema: JSONSchema) => {
  if (schema.type !== 'object') {
    return schema.default
  }

  if (!schema.required || schema.required.length === 0) {
    return {}
  }

  const properties = schema.properties
  if (!properties) {
    throw new Error(`schema.required is not empty but schema.properties is missing: ${JSON.stringify(schema)}`)
  }

  return Object.entries(properties).reduce<Record<string, any>>((fields, [key, property]) => {
    if (typeof property === 'boolean') {
      // Throw here as we don't generate JSON schemas with refs
      throw new Error(`schema.properties["${key}"] is a boolean instead of an object: ${JSON.stringify(schema)}`)
    }

    /**
     * JSON schemas should never use `undefined` as default values.
     * `undefined` indicates the missing of a default value.
     */
    if (property.default !== undefined) {
      fields[key] = prepareData(property)
    }

    return fields
  }, {})

  // return schema.required.reduce<Record<string, any>>((fields, key) => {
  //   const property = properties[key]
  //   if (typeof property === 'boolean') {
  //     // Throw here as we don't generate JSON schemas with refs
  //     throw new Error(`schema.properties["${key}"] is a boolean instead of an object: ${JSON.stringify(schema)}`)
  //   }

  //   /**
  //    * JSON schemas should never use `undefined` as default values.
  //    * `undefined` indicates the missing of a default value.
  //    */
  //   if (property.default !== undefined) {
  //     fields[key] = prepareData(property)
  //   }

  //   return fields
  // }, {})
}

watch(language, (newLanguage) => {
  editor.setModel(newLanguage === 'json' ? jsonModel : yamlModel)
})

onMounted(() => {
  // schema always starts with a record in the root
  const jsonSchema = buildRecordSchema(cloneDeep(props.schema))
  console.log('translated JSON schema:', jsonSchema)

  configureMonacoYaml(monaco, {
    schemas: [
      {
        uri: 'kong://kong', // have to keep this or make this hidden in the lib
        fileMatch: ['*'],
        schema: jsonSchema,
      },
    ],
  })

  monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
    validate: true,
    schemas: [
      {
        uri: '',
        fileMatch: ['*'],
        schema: jsonSchema,
      },
    ],
  })

  jsonModel = monaco.editor.createModel(JSON.stringify(prepareData(jsonSchema), null, 2), 'json')
  yamlModel = monaco.editor.createModel(YAML.stringify(prepareData(jsonSchema), { indent:2 }), 'yaml')

  editor = monaco.editor.create(editorRef.value as HTMLElement, {
    language: language.value,
    theme: 'vs',
    automaticLayout: true,
    model: language.value === 'json' ? jsonModel : yamlModel,
  })

  // Credits: https://github.com/microsoft/monaco-editor/issues/2241#issuecomment-997339142
  let { widget } = editor.getContribution('editor.contrib.suggestController')
  if (widget) {
    const suggestWidget = widget.value
    if (suggestWidget && suggestWidget._setDetailsVisible) {
      // This will default to visible details. But when user switches it off
      // they will remain switched off:
      suggestWidget._setDetailsVisible(true)
    }
    // I also wanted my widget to be shorter by default:
    // if (suggestWidget && suggestWidget._persistedSize) {
    //   suggestWidget._persistedSize.store({ width: 200, height: 256 })
    // }
  }

  editor.onDidChangeModelContent(async () => {})
})

onBeforeUnmount(() => {
  editor?.dispose()
})
</script>

<style lang="scss" scoped>
.plugin-config-editor-toolbar {
  display: flex;
  flex-direction: row;
  justify-content: flex-end;
  margin-bottom: 8px;

  .language-control {
    max-width: 300px;
  }
}

.plugin-config-editor-editor {
  height: 500px;
  width: 100%;
}
</style>
