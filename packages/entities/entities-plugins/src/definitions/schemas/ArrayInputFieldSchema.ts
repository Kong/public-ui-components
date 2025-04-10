export const ArrayInputFieldSchema = {
  type: 'array',
  valueType: 'string',
  valueArrayType: 'array',
  itemContainerComponent: 'FieldArrayItem',
  fieldClasses: 'kong-form-array-field',
  fieldItemsClasses: 'kong-form-array-field-item',
  inputAttributes: { class: 'form-control', style: { minWidth: '200px' } },
  validator: 'array',
  styleClasses: 'kong-form-field-wrapper',
  newElementButtonLabel: '+ Add',
  newElementButtonLabelClasses: 'kong-form-new-element-button-label',
}

export const BadgeArrayInputFieldSchema = {
  type: 'badge-array',
  fieldClasses: 'kong-form-badge-array-field',
  inputAttributes: { class: 'form-control', style: { minWidth: '200px' } },
}
