export default {
  fields: [
    {
      'service-id': {
        label: 'Gateway Service',
        placeholder: 'Select a Gateway Service',
        type: 'AutoSuggest',
        valueType: 'object-expand',
        required: true,
        entity: 'services',
        inputValues: {
          fields: ['name', 'id'],
        },
      },
    }, {
      path: {
        label: 'Document Spec Path',
        placeholder: 'Select a spec from Portal',
        type: 'AutoSuggest',
        valueType: 'string',
        required: true,
        entity: 'files?type=spec',
        returnKey: 'path',
        inputValues: {
          fields: ['path'],
        },
      },
    },
  ],
}
