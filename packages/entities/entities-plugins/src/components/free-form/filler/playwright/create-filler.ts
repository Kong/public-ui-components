import { handlers, type Handlers } from './handlers'
import type { Page } from '@playwright/test'
import type {
  FormSchema,
  UnionFieldSchema,
  StringFieldSchema,
  NumberLikeFieldSchema,
  BooleanFieldSchema,
  SetFieldSchema,
  MapFieldSchema,
  JsonFieldSchema,
  ForeignFieldSchema,
} from '../../../../types/plugins/form-schema'
import {
  createContext,
  walkFields,
  getHandlerType,
  getArrayItemInfo,
  isRecordArrayItem,
  type FillerContext,
  type FieldToFill,
  type ArrayFieldSchema,
  type RecordFieldSchema,
} from '../shared/field-walker'

export interface TypeOptions {
  delay?: number
}

export interface FillerInstance {
  fill: (data: Record<string, any>) => Promise<void>
  fillField: (fieldKey: string, value: any, typeOptions?: TypeOptions) => Promise<void>
  schemaMap: Record<string, UnionFieldSchema>
  handlers: Handlers
}

export function createFiller(
  page: Page,
  schema: FormSchema,
  customHandlers?: Partial<Handlers>,
): FillerInstance {
  const ctx = createContext(schema)
  const mergedHandlers = { ...handlers, ...customHandlers }

  async function fillFields(fields: typeof schema.fields, data: Record<string, any>, prefix: string = ''): Promise<void> {
    for (const field of walkFields(fields, data, ctx, prefix)) {
      await fillFieldByInfo(field)
    }
  }

  async function fillFieldByInfo({ handlerType, fieldKey, fieldSchema, value }: FieldToFill, typeOptions?: TypeOptions): Promise<void> {
    switch (handlerType) {
      case 'string':
        await mergedHandlers.fillString({ page, fieldKey, fieldSchema: fieldSchema as StringFieldSchema, value, typeOptions })
        break
      case 'number':
        await mergedHandlers.fillNumber({ page, fieldKey, fieldSchema: fieldSchema as NumberLikeFieldSchema, value, typeOptions })
        break
      case 'boolean':
        await mergedHandlers.fillBoolean({ page, fieldKey, fieldSchema: fieldSchema as BooleanFieldSchema, value, typeOptions })
        break
      case 'enum':
        await mergedHandlers.fillEnum({ page, fieldKey, fieldSchema: fieldSchema as StringFieldSchema | NumberLikeFieldSchema | SetFieldSchema, value, typeOptions })
        break
      case 'tag':
        await mergedHandlers.fillTag({ page, fieldKey, fieldSchema: fieldSchema as SetFieldSchema, value, typeOptions })
        break
      case 'map':
        await mergedHandlers.fillMap({ page, fieldKey, fieldSchema: fieldSchema as MapFieldSchema, value, typeOptions })
        break
      case 'json':
        await mergedHandlers.fillJson({ page, fieldKey, fieldSchema: fieldSchema as JsonFieldSchema, value, typeOptions })
        break
      case 'foreign':
        await mergedHandlers.fillForeign({ page, fieldKey, fieldSchema: fieldSchema as ForeignFieldSchema, value, typeOptions })
        break
      case 'array':
        await mergedHandlers.fillArray({
          page,
          fieldKey,
          fieldSchema: fieldSchema as ArrayFieldSchema,
          value,
          onFillItem: async (index: number, itemValue: any) => {
            await handleArrayItem(ctx, fieldKey, index, itemValue)
          },
        })
        break
      case 'record':
        await mergedHandlers.fillRecord({
          page,
          fieldKey,
          fieldSchema: fieldSchema as RecordFieldSchema,
          value,
          onFillChildren: async () => {
            await fillFields((fieldSchema as RecordFieldSchema).fields, value, fieldKey)
          },
        })
        break
    }
  }

  async function handleArrayItem(ctx: FillerContext, fieldKey: string, index: number, itemValue: any): Promise<void> {
    const { itemKey, itemSchema } = getArrayItemInfo(fieldKey, index, ctx)

    if (isRecordArrayItem(itemSchema)) {
      await fillFields(itemSchema.fields, itemValue, itemKey)
    } else {
      await fillFieldByInfo({
        handlerType: getHandlerType(itemSchema),
        fieldKey: itemKey,
        fieldSchema: itemSchema,
        value: itemValue,
      })
    }
  }

  async function fill(data: Record<string, any>): Promise<void> {
    if (schema.fields && Array.isArray(schema.fields)) {
      await fillFields(schema.fields, data)
    }
  }

  async function fillField(fieldKey: string, value: any, typeOptions?: TypeOptions): Promise<void> {
    const fieldSchema = ctx.schemaMap[fieldKey]
    if (!fieldSchema) {
      throw new Error(`Field schema for "${fieldKey}" not found in schema map`)
    }

    await fillFieldByInfo({
      handlerType: getHandlerType(fieldSchema),
      fieldKey,
      fieldSchema,
      value,
    }, typeOptions)
  }

  return {
    fill,
    fillField,
    schemaMap: ctx.schemaMap,
    handlers: mergedHandlers,
  }
}
