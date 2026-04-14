/**
 * Keeps the managed add-on card schema in sync with fetched display data.
 * Call `setManagedAddOnSchemaFromDisplayRecord` after the add-on payload is shaped.
 */
import { ref, type Ref } from 'vue'
import type { ConfigurationSchema } from '@kong-ui-public/entities-shared'
import type { AddOnRecord } from '../types/cloud-gateways-add-on'
import {
  buildManagedAddOnCardSchema,
  pickManagedAddOnCardRecord,
  type ManagedAddOnCardRecord,
  type ManagedAddOnTranslate,
} from '../helpers/managed-add-on-config-schema'
import useI18n from './useI18n'

const useManagedCacheAddOnDisplaySchema = (): {
  managedAddOnConfigSchema: Ref<ConfigurationSchema>
  setManagedAddOnSchemaFromDisplayRecord: (display: AddOnRecord) => void
} => {
  const { i18n: { t } } = useI18n()
  const managedAddOnConfigSchema = ref<ConfigurationSchema>({})

  // Adapter so schema helpers can use i18n labels
  const translate: ManagedAddOnTranslate = (path: string) => t(path as never)

  // Keep supported keys only, then build the card schema from them
  const setManagedAddOnSchemaFromDisplayRecord = (display: AddOnRecord): void => {
    const picked: ManagedAddOnCardRecord = pickManagedAddOnCardRecord(display)
    managedAddOnConfigSchema.value = buildManagedAddOnCardSchema(picked, translate)
  }

  return {
    managedAddOnConfigSchema,
    setManagedAddOnSchemaFromDisplayRecord,
  }
}

export default useManagedCacheAddOnDisplaySchema
