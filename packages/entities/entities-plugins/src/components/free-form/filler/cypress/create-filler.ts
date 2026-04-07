import { handlers, type Handlers, type ActionOptions } from './handlers'
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
  getMapEntryInfo,
  isRecordArrayItem,
  type FillerContext,
  type FieldToFill,
  type ArrayFieldSchema,
  type RecordFieldSchema,
} from '../shared/field-walker'

export interface FillerInstance {
  fill: (data: Record<string, any>) => void
  fillField: (fieldKey: string, value: any, actionOptions?: ActionOptions) => void
  schemaMap: Record<string, UnionFieldSchema>
  handlers: Handlers
}

export function createFiller(
  schema: FormSchema,
  customHandlers?: Partial<Handlers>,
): FillerInstance {
  const ctx = createContext(schema)
  const mergedHandlers = { ...handlers, ...customHandlers }

  function fillFields(fields: typeof schema.fields, data: Record<string, any>, prefix: string = ''): void {
    for (const field of walkFields(fields, data, ctx, prefix)) {
      fillFieldByInfo(field)
    }
  }

  function fillFieldByInfo({ handlerType, fieldKey, fieldSchema, value }: FieldToFill, actionOptions?: ActionOptions): void {
    switch (handlerType) {
      case 'string':
        mergedHandlers.fillString({ fieldKey, fieldSchema: fieldSchema as StringFieldSchema, value, actionOptions })
        break
      case 'number':
        mergedHandlers.fillNumber({ fieldKey, fieldSchema: fieldSchema as NumberLikeFieldSchema, value, actionOptions })
        break
      case 'boolean':
        mergedHandlers.fillBoolean({ fieldKey, fieldSchema: fieldSchema as BooleanFieldSchema, value, actionOptions })
        break
      case 'enum':
        mergedHandlers.fillEnum({ fieldKey, fieldSchema: fieldSchema as StringFieldSchema | NumberLikeFieldSchema | SetFieldSchema, value, actionOptions })
        break
      case 'tag':
        mergedHandlers.fillTag({ fieldKey, fieldSchema: fieldSchema as SetFieldSchema, value, actionOptions })
        break
      case 'map':
        mergedHandlers.fillMap({
          fieldKey,
          fieldSchema: fieldSchema as MapFieldSchema,
          value,
          onFillEntry: (kidId: string, entryValue: any) => {
            handleMapEntry(ctx, fieldKey, kidId, entryValue)
          },
        })
        break
      case 'json':
        mergedHandlers.fillJson({ fieldKey, fieldSchema: fieldSchema as JsonFieldSchema, value, actionOptions })
        break
      case 'foreign':
        mergedHandlers.fillForeign({ fieldKey, fieldSchema: fieldSchema as ForeignFieldSchema, value, actionOptions })
        break
      case 'array':
        mergedHandlers.fillArray({
          fieldKey,
          fieldSchema: fieldSchema as ArrayFieldSchema,
          value,
          onFillItem: (index: number, itemValue: any) => {
            handleArrayItem(ctx, fieldKey, index, itemValue)
          },
        })
        break
      case 'record':
        mergedHandlers.fillRecord({
          fieldKey,
          fieldSchema: fieldSchema as RecordFieldSchema,
          value,
          onFillChildren: () => {
            fillFields((fieldSchema as RecordFieldSchema).fields, value, fieldKey)
          },
        })
        break
    }
  }

  function handleArrayItem(ctx: FillerContext, fieldKey: string, index: number, itemValue: any): void {
    const { itemKey, itemSchema } = getArrayItemInfo(fieldKey, index, ctx)

    if (isRecordArrayItem(itemSchema)) {
      fillFields(itemSchema.fields, itemValue, itemKey)
    } else {
      fillFieldByInfo({
        handlerType: getHandlerType(itemSchema),
        fieldKey: itemKey,
        fieldSchema: itemSchema,
        value: itemValue,
      })
    }
  }

  function handleMapEntry(ctx: FillerContext, fieldKey: string, kidId: string, entryValue: any): void {
    const { entryKey, entrySchema } = getMapEntryInfo(fieldKey, kidId, ctx)

    fillFieldByInfo({
      handlerType: getHandlerType(entrySchema),
      fieldKey: entryKey,
      fieldSchema: entrySchema,
      value: entryValue,
    })
  }

  function fill(data: Record<string, any>): void {
    if (schema.fields && Array.isArray(schema.fields)) {
      fillFields(schema.fields, data)
    }
  }

  function fillField(fieldKey: string, value: any, actionOptions?: ActionOptions): void {
    const fieldSchema = ctx.schemaMap[fieldKey]
    if (!fieldSchema) {
      throw new Error(`Field schema for "${fieldKey}" not found in schema map`)
    }

    fillFieldByInfo({
      handlerType: getHandlerType(fieldSchema),
      fieldKey,
      fieldSchema,
      value,
    }, actionOptions)
  }

  return {
    fill,
    fillField,
    schemaMap: ctx.schemaMap,
    handlers: mergedHandlers,
  }
}
