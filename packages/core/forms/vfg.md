# Vue Form Generator

Repo: [vue-form-generator](https://github.com/vue-generators/vue-form-generator)

## Custom Fields
You can create custom fields where you need added functionality inside of Vue Form Generator and
a traditional input wont suffice. To read more about custom fields check out [the docs](https://vue-generators.gitbook.io/vue-generators/fields/custom_fields).

To write a new custom field...
- Create a new Vue component in `src/plugins/vfg` and name it camel case starting with _field_ e.g. `FieldAdvanced`
- Import and register your component in `/src/main.js`
```js
// Vue Form Generator & third-party modules
import FieldAdvanced from '@/plugins/vfg/FieldAdvanced'
vue.use('FieldAdvanced', FieldAdvanced)
```
- Define your custom schema so the field renders within `<vue-form-generator>`. The field type is defined with the `type` key.
```js
const schema = {
  'service-id': { label: 'Service ID', type: 'input', inputType: 'text', valueType: 'object-expand', placeholder: 'Enter a Service ID', required: true },
  // Custom Field Schema
  'advanced': {
    label: 'Advanced Fields',
    type: 'advanced',
    fields: [
      { label: 'Regex Priority', model: 'regex_priority', type: 'input', inputType: 'number', default: 0, placeholder: 'Set a Regex Priority', styleClasses: 'optional', min: 0 },
      { label: 'Strip Path', model: 'strip_path', type: 'checkbox', default: true },
      { label: 'Preserve Host', model: 'preserve_host', type: 'checkbox', default: false }
    ]
  }
}
module.exports = schema
```

## Fields in Manager
We have a small number of custom fields we use throughout the application.
1) [Field Advanced](https://github.com/Kong/kong-admin/blob/master/src/plugins/vfg/FieldAdvanced.vue)
  Places all items in nested `fields` array in a dropdown.
1) [FieldArray](https://github.com/Kong/kong-admin/blob/master/src/plugins/vfg/FieldArray.vue) & [FieldArrayItems](https://github.com/Kong/kong-admin/blob/master/src/plugins/vfg/FieldArrayItem.vue)
  Adds support for array type fields. Used in places like Routes to support adding multiple paths
  View vfg-field-array from [gwenaelp](https://github.com/gwenaelp) on [Github](https://github.com/gwenaelp/vfg-field-array).
1) [Field Autosuggest](https://github.com/Kong/kong-admin/blob/master/src/plugins/vfg/FieldAutoSuggest.vue)
  Adds field to look up and search provided entity. Allows you to set which items from entity object to show in dropdown.
1) [Field SelectionGroup](https://github.com/Kong/kong-admin/blob/master/src/plugins/vfg/FieldSelectionGroup.vue)
  Creates an array of groups and creates a radio selection for each. By passing a fields array inside the option you can nest fields inside each. This is used in Plugins where you can apply to a **Global** scope with no sub fields or **Scoped** to an entity.
  ```js
  selectionGroup: {
    type: 'selectionGroup',
    fields: [
      {
        label: 'Global',
        description: 'All Services & Routes in this workspace'
      },
      {
        label: 'Scoped',
        description: 'Specific Services and/or Routes in this workspace',
        fields: [
          {
            model: 'service-id',
            type: 'input',
            inputType: 'text'
            entity: 'services',
          }
        ]
      }
    ]
  }
  ```
1) [FieldRadio](https://github.com/Kong/kong-admin/blob/master/src/plugins/vfg/FieldRadio.vue)
  Takes an array of radio group values and adds custom form group styling as well as more flexible attribute options such as checked to the fields.
1) [FieldMetric](https://github.com/Kong/kong-admin/blob/master/src/plugins/vfg/FieldMetric.vue)
  A slider for quantitative fields
1) [Field Object Advanced](https://github.com/Kong/kong-admin/blob/master/src/plugins/vfg/FieldObjectAdvannced.vue)
  Adds ability to specify a dynamic object field for variable `key:value` pairs, with a subschema. This was initially built for usage with Kong plugin schemas with a field type of `"map"` re: [response-ratelimiting](https://github.com/Kong/kong/blob/master/kong/plugins/response-ratelimiting/schema.lua#L52) plugin.
