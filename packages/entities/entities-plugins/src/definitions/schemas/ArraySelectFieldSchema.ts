export const createArraySelectFieldSchema = (values: string[]) => ({
  type: 'array',
  valueType: 'string',
  valueArrayType: 'array',
  itemContainerComponent: 'FieldArrayItem',
  fieldClasses: 'kong-form-array-field',
  fieldItemsClasses: 'kong-form-array-field-item',
  validator: 'array',
  styleClasses: 'kong-form-field-wrapper',
  newElementButtonLabel: '+ Add',
  newElementButtonLabelClasses: 'kong-form-new-element-button-label',
  items: {
    type: 'select',
    values,
    selectOptions: {
      hideNoneSelectedText: true,
    },
    ...(values.length > 0 ? { default: values[0] } : {}),
  },
})
