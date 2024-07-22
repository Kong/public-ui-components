<template>
  <component
    :is="errorComponent"
    v-if="state === ExpressionsEditorState.ERROR"
    data-testid="route-form-expressions-editor-loader-error"
  />
  <component
    :is="loadingComponent"
    v-else-if="state === ExpressionsEditorState.LOADING"
    data-testid="route-form-expressions-editor-loader-loading"
  />
  <RouteFormExpressionsEditor
    v-else
    v-model="expression"
    :playground-trigger-text="t('form.expressionPlayground.testLink')"
    :protocol="props.protocol"
    @notify="handleNotify"
  />
  <slot
    :expression="{ value: expression, update: setExpression }"
    name="after-editor"
    :state="state"
  />
</template>

<script setup lang="ts">
/**
 * This is a loader component to lazy-load the @kong-ui-public/expressions and RouteFormExpressionsEditor,
 * which depends on @kong-ui-public/expressions, to avoid loading the Expressions language support and the
 * editor until they are used.
 */
import { defineAsyncComponent, h, onMounted, ref, type Component } from 'vue'
import composables from '../composables'
import { ExpressionsEditorState } from '../types'

const { i18n: { t } } = composables.useI18n()
const { toaster } = composables.useToaster()

const loadingComponent: Component = {
  render: () => h('div', t('form.expressions_editor.loading')),
}

const errorComponent: Component = {
  render: () => h('div', t('form.expressions_editor.error')),
}

const RouteFormExpressionsEditor = defineAsyncComponent({
  loader: async () => {
    return import('./RouteFormExpressionsEditor.vue')
  },
  loadingComponent,
  errorComponent,
})

const props = defineProps<{ protocol?: string }>()
const state = ref<ExpressionsEditorState>(ExpressionsEditorState.LOADING)

const expression = defineModel<string>({ required: true })

// Useful when slot content is trying to update the expression (e.g., router playground)
const setExpression = (value: string) => {
  expression.value = value
}

const handleNotify = ({ message, type }: {
  message: string;
  type: string;
}) => {
  toaster.open({
    appearance: type,
    message,
  })
}

onMounted(async () => {
  try {
    await (await import('@kong-ui-public/expressions')).asyncInit
    state.value = ExpressionsEditorState.READY
  } catch (e) {
    state.value = ExpressionsEditorState.ERROR
    console.error(e)
  }
})
</script>
