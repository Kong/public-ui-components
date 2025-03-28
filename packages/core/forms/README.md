# @kong-ui-public/forms

## Requirements

- `vue` **must** be initialized in the host application
- `@kong/kongponents` **must** be available as a `dependency` in the host application and registered globally, along with the Kongponents style import. [See here for instructions on installing Kongponents](https://kongponents.konghq.com/#globally-install-all-kongponents).
- `@kong-ui-public/i18n` must be available as a `dependency` in the host application.

## how to add shared form

Let's say you need introduce shared customization for 'PostFunction' plugin form.
Here are the steps

1. add `PostFunction.vue` into `src/forms/`

2. modify `finalSchema` computable in `PostFunction.vue` the way you like it.

3. add export for this component into `src/forms/index.ts`

4. add mapping for model name -> component name into `getSharedFormName` function defined in `src/index.ts`

That's it - next time the version of @kong-ui-public/forms is used - your `src/forms/PostFunction.vue` will be presented when user selects `Post Function` plugin to install or edit.

## how to add a custom field component
You can define custom field components to be used for specific fields.

For example, the field schema should like this:
```json
{
  type: 'array',
  component: CatFoodField,  // <== the custom Vue component
  model: 'eats',
  id: 'eats',
  label: 'Eats',
}
```

Please take a look at `sandbox/CatFoodField.vue` for an example of a custom field component.

You should have at least the following props, emits and function defined:
```ts
const props = defineProps<{
  disabled?: boolean
  formOptions?: Record<string, any>
  model?: Record<string, any>
  schema: Record<string, any>
  vfg: Record<string, any>
  errors?: Array<any>
  hint?: string
}>()

const emit = defineEmits<{
  (event: 'modelUpdated', value: any, model: Record<string, any>): void
}>()

const { clearValidationErrors } = composables.useAbstractFields({
  model: propsRefs.model,
  schema: props.schema,
  formOptions: props.formOptions,
  emitModelUpdated: (data: { value: any, model: Record<string, any> }): void => {
    emit('modelUpdated', data.value, data.model)
  },
})

defineExpose({
  clearValidationErrors,
})
```

`composables.useAbstractFields` is a useful helper that can be used to simplify the implementation of custom field components.

