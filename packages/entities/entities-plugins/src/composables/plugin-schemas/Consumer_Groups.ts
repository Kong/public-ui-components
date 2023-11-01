export const policySchema = {
  limit: {
    label: 'Limit',
    type: 'input',
    inputType: 'text',
    valueArrayType: 'number',
    valueType: 'array',
    required: true,
  },
  retry_after_jitter_max: {
    label: 'Retry after jitter max',
    type: 'input',
    inputType: 'number',
    required: true,
  },
  window_size: {
    label: 'Window size',
    type: 'input',
    inputType: 'text',
    valueArrayType: 'number',
    valueType: 'array',
    required: true,
  },
  window_type: {
    label: 'Window type',
    type: 'select',
    inputType: 'text',
    required: true,
    default: 'sliding',
    values: [
      { name: 'sliding', id: 'sliding' },
      { name: 'fixed', id: 'fixed' },
    ],
    placeholder: 'Select window type',
  },
}
