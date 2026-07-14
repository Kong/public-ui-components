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

  // Scope all option interactions to this field's own popover to avoid matching
  // identically-named options from other enum fields on the same form.
  const popoverSelector = selectors.selectTrigger(fieldKey)

  // Select each value within the dropdown
  for (const optionValue of fieldSchema.one_of ?? (fieldSchema as SetFieldSchema).elements?.one_of ?? []) {
    if (optionValue !== undefined && optionValue !== null) {
      const itemSelector = isMulti
        ? selectors.multiSelectItem(String(optionValue))
        : selectors.selectItem(String(optionValue))

      // clear default value
      if (isMulti) {
        const isSelected = await page.locator(popoverSelector).locator(`${itemSelector} button.selected`).count() > 0
        if (isSelected) {
          await page.locator(popoverSelector).locator(itemSelector).click()
        }
      }

      if (values.includes(optionValue)) {
        await page.locator(popoverSelector).locator(itemSelector).click()
      }
    }
  }
}
