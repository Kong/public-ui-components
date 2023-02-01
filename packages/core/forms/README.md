# @kong-ui-public/forms

## how to add shared form

Let's say you need to introduce shared customization for 'PostFunction' plugin form. Here are the steps:

1. add `PostFunction.vue` into `src/forms/`

2. modify `finalSchema` computable in `PostFunction.vue` the way you like it.

3. add export for this component into `src/forms/index.ts`

4. add mapping for model name -> component name into `getSharedFormName` function defined in `src/index.ts`

That's it - next time the version of @kong-ui-public/forms is used - your `src/forms/PostFunction.vue` will be presented when user selects `Post Function` plugin to install or edit.
