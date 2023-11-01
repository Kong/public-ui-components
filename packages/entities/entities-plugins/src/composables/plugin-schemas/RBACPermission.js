export default {
  name: {
    type: 'input',
    inputType: 'text',
  },
  resources: {
    type: 'checklist',
    multi: true,
    multiSelect: true,
    transform(data) {
      return data
        ? data.join(',')
        : null
    },
  },
  actions: {
    type: 'checklist',
    values: ['create', 'read', 'update', 'delete'],
    multi: true,
    multiSelect: true,
    transform(data) {
      return data
        ? data.join(',')
        : null
    },
  },
  negative: {
    type: 'checkbox',
    default: false,
  },
  comment: {
    type: 'input',
    inputType: 'text',
  },
}
