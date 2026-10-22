import { useDatasourceConfigStore } from '@kong-ui-public/analytics-config-store'
import { fieldLabel, type FieldLabelOptions } from '../utils/field-label'
import useI18n from './useI18n'

export default function useFieldLabel() {
  const { i18n } = useI18n()
  const datasourceConfigStore = useDatasourceConfigStore()

  return (key: string, options?: FieldLabelOptions): string =>
    fieldLabel(i18n, datasourceConfigStore.fieldTranslationMap, key, options)
}
