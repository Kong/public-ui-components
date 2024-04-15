<template>
  <component
    :is="errorComponent"
    v-if="expressionInitError"
  />
  <component
    :is="loadingComponent"
    v-else-if="!expressionInitialized"
  />
  <RouteFormExpressionsEditor
    v-else
    v-model="expression"
    :protocol="props.protocol"
  />
</template>

<script setup lang="ts">
/**
 * This is a loader component to lazy-load the @kong-ui-public/expressions and RouteFormExpressionsEditor,
 * which depends on @kong-ui-public/expressions, to avoid loading the Expressions language support and the
 * editor until they are used.
 */
import useI18n from '../composables/useI18n'
import { defineAsyncComponent, onMounted, ref, type Component, h } from 'vue'

const { i18n: { t } } = useI18n()

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
const expression = defineModel<string>({ required: true })
const expressionInitialized = ref(false)
const expressionInitError = ref(false)

onMounted(async () => {
  try {
    await (await import('@kong-ui-public/expressions')).asyncInit
    expressionInitialized.value = true
  } catch (e) {
    expressionInitError.value = true
    console.error(e)
  }
})
</script>
