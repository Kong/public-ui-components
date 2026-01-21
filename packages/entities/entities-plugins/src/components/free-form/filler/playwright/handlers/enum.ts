import type { StringFieldSchema, NumberLikeFieldSchema, SetFieldSchema } from '../../../../../types/plugins/form-schema'
import type { HandlerOption } from './types'
import { selectors } from '../../shared/selectors'
import { isMultiEnumField } from '../../shared/schema-utils'

export async function fillEnum(option: HandlerOption<StringFieldSchema | NumberLikeFieldSchema | SetFieldSchema>): Promise<void> {
  const { page, fieldKey, fieldSchema, value } = option

  const isMulti = isMultiEnumField(fieldSchema)
  const values = isMulti ? (Array.isArray(value) ? value : [value]) : [value]

  // Click to open dropdown
  const fieldSelector = selectors.field(fieldKey)
  await page.locator(fieldSelector).click()

  // Select each value
  for (const optionValue of fieldSchema.one_of ?? (fieldSchema as SetFieldSchema).elements?.one_of ?? []) {
    if (optionValue !== undefined && optionValue !== null) {
      const itemSelector = isMulti
        ? selectors.multiSelectItem(String(optionValue))
        : selectors.selectItem(String(optionValue))

      // clear default value
      const isSelected = await page.locator(`${itemSelector} button.selected`).count() > 0
      if (isSelected) {
        await page.locator(itemSelector).click()
      }

      if (values.includes(optionValue)) {
        await page.locator(itemSelector).click()
      }
    }
  }
}
