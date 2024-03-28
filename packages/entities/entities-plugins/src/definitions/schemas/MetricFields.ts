import type { MetricFieldsSchema } from '../../types/plugins/metric-fields'

export const metricFieldsSchema: MetricFieldsSchema = {
  type: 'array',
  showRemoveButton: false,
  newElementButtonLabelClasses: 'kong-form-new-element-button-label',
  itemContainerComponent: 'FieldMetric',
  fieldClasses: 'metrics-wrapper',
}
