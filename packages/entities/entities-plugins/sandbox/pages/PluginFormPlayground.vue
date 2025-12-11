<template>
  <div class="plugin-form-playground-sandbox">
    <KSlideout
      :close-on-blur="false"
      :has-overlay="false"
      max-width="50vw"
      title="Edit Schema"
      :visible="schemaOpen"
      @close="schemaOpen = false"
    >
      <div class="form">
        <KSelect
          v-model="pluginType"
          enable-filtering
          :items="pluginTypes"
          label="Plugin type"
        />
        <KTextArea
          ref="text"
          v-model="schemaText"
          autosize
          :character-limit="false"
          class="schema-text"
          label="Schema"
          required
        />
      </div>
    </KSlideout>
    <section class="controls">
      <KButton @click="schemaOpen = !schemaOpen">
        Edit Schema
      </KButton>
    </section>
    <pre
      v-if="parseError"
      class="error"
    >{{ parseError }}</pre>
    <section
      v-if="!renderError"
      class="forms"
    >
      <h2>Konnect API</h2>
      <PluginForm
        :key="formKey"
        :config="konnectConfig"
        enable-vault-secret-picker
        :plugin-type="pluginType || ''"
        :schema="schema"
        use-custom-names-for-plugin
        @update="onUpdate"
      />

      <h2>Kong Manager API</h2>
      <PluginForm
        :key="formKey"
        :config="kongManagerConfig"
        enable-vault-secret-picker
        :plugin-type="pluginType || ''"
        :schema="schema"
        @update="onUpdate"
      />
    </section>
    <pre
      v-else
      class="error"
    >{{ renderError }}</pre>
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onErrorCaptured,
  ref,
  useTemplateRef,
  watch,
} from 'vue'
import { useRouter } from 'vue-router'
import type {
  KonnectPluginFormConfig,
  KongManagerPluginFormConfig,
} from '../../src'
import { PluginForm } from '../../src'
import { PLUGIN_METADATA } from '../../src/definitions/metadata'

function save(type: 'pluginType' | 'schema', value: unknown) {
  localStorage.setItem(`plugin-form-playground:${type}`, JSON.stringify(value))
}

function load(type: 'pluginType' | 'schema', defaultValue?: unknown) {
  const stored = localStorage.getItem(`plugin-form-playground:${type}`)
  return stored ? JSON.parse(stored) : defaultValue
}

const router = useRouter()
const controlPlaneId = import.meta.env.VITE_KONNECT_CONTROL_PLANE_ID || ''

const pluginTypes = [
  { label: '🚫', value: '' },
  ...Object.keys(PLUGIN_METADATA).map((key) => ({
    label: key,
    value: key,
  })),
].sort((a, b) => a.label.localeCompare(b.label))

const storedPluginType = load('pluginType', '')
const pluginType = ref<string>(
  pluginTypes.find(({ value }) => value === storedPluginType)
    ? storedPluginType
    : '',
)

const defaultSchema = {
  fields: [],
}
const schemaOpen = ref(false)

const storedSchema = load('schema', JSON.stringify(defaultSchema, null, 2))
const schemaText = ref(storedSchema)

watch(schemaOpen, async (open) => {
  if (open) {
    await nextTick()
    text.value?.$el.querySelector('textarea').select()
  }
})

const schema = computed(() => {
  try {
    return JSON.parse(schemaText.value)
  } catch {
    return defaultSchema
  }
})

const formKey = computed(() => {
  return JSON.stringify([pluginType.value, schema.value])
})

const renderError = ref<string>('')
const parseError = computed(() => {
  try {
    JSON.parse(schemaText.value)
    return ''
  } catch (e: unknown) {
    return (e as Error).message
  }
})

const text = useTemplateRef('text')

const konnectConfig = ref<KonnectPluginFormConfig>({
  app: 'konnect',
  apiBaseUrl: '/us/kong-api', // `/{geo}/kong-api`, with leading slash and no trailing slash; Consuming app would pass in something like `https://us.api.konghq.com`
  // Set the root `.env.development.local` variable to a control plane your PAT can access
  controlPlaneId,
  // force the scope
  // entityType: 'services',
  // entityId: '6f1ef200-d3d4-4979-9376-726f2216d90c',
  cancelRoute: { name: 'home' },
  experimentalRenders: {
    keyAuthIdentityRealms: true,
  },
  geoApiServerUrl: 'https://us.api.konghq.tech',
  enableDeckTab: true,
})

const kongManagerConfig = ref<KongManagerPluginFormConfig>({
  app: 'kongManager',
  workspace: 'default',
  apiBaseUrl: '/kong-manager', // For local dev server proxy
  kongAdminApiUrl: 'https://localhost:8001',
  // force the scope
  // entityType: 'consumers',
  // entityId: '123-abc-i-lover-cats',
  cancelRoute: { name: 'home' },
})

const onUpdate = (payload: Record<string, any>) => {
  console.log('update', payload)

  router.push({ name: 'home' })
}

watch(pluginType, () => {
  save('pluginType', pluginType.value)
})

watch(schemaText, () => {
  renderError.value = ''

  save('schema', schemaText.value)
})

onErrorCaptured((error) => {
  renderError.value = error.message
  schemaOpen.value = true
  return false
})
</script>

<style lang="scss" scoped>
.plugin-form-playground-sandbox {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.controls {
  position: fixed;
  right: 55%;
  top: 20px;
  z-index: 10;
}

.form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 6px;
}

.schema-text :deep(textarea) {
  font-family: monospace !important;
}

.error {
  color: #d60027;
  margin-top: 16px;
}
</style>
