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
    :protocol="props.protocol"
    :show-expressions-modal-entry="showExpressionsModalEntry"
    @notify="emit('notify', $event)"
  >
    <RocketIcon :size="KUI_ICON_SIZE_30" />
    <span>{{ t('form.expression_playground.test_link') }}</span>
  </RouteFormExpressionsEditor>
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
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { RocketIcon } from '@kong/icons'
import { defineAsyncComponent, h, onMounted, ref, type Component } from 'vue'
import composables from '../composables'
import { ExpressionsEditorState } from '../types'

const { i18n: { t } } = composables.useI18n()

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

const props = defineProps<{
  protocol?: string
  showExpressionsModalEntry?: boolean
}>()
const emit = defineEmits<{
  (e: 'notify', options: { message: string, type: string }): void
}>()
const state = ref<ExpressionsEditorState>(ExpressionsEditorState.LOADING)

const expression = defineModel<string>({ required: true })

// Useful when slot content is trying to update the expression (e.g., router playground)
const setExpression = (value: string) => {
  expression.value = value
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

<style lang="scss">
.route-form-open-in-playground {
  align-items: center;
  color: var(--kui-color-text-primary-strong, $kui-color-text-primary-strong);
  cursor: pointer;
  display: flex;
  flex-direction: row;
  font-size: var(--kui-font-size-30, $kui-font-size-30);
  font-weight: bold;
  gap: var(--kui-space-40, $kui-space-40);
  justify-content: flex-start;
  margin-top: var(--kui-space-50, $kui-space-50);

  &.disabled {
    cursor: not-allowed;
    opacity: 0.5;
  }
}
</style>
