<template>
  <div class="dk-cache-panel">
    <h3 class="title">
      {{ t('plugins.free-form.datakit.flow_editor.panel_segments.resources.cache.title') }}
    </h3>

    <div
      v-if="strategy"
      class="cache-item"
    >
      <div class="cache-item-key">
        <DatabaseIcon
          :color="`var(--kui-color-text-neutral, ${KUI_COLOR_TEXT_NEUTRAL})`"
          :size="`var(--kui-icon-size-30, ${KUI_ICON_SIZE_30})`"
        />
        <div class="cache-item-key-text">
          {{ strategy }}
        </div>
      </div>
      <KDropdown>
        <KButton
          appearance="tertiary"
          icon
        >
          <MoreIcon :color="`var(--kui-color-text, ${KUI_COLOR_TEXT})`" />
        </KButton>

        <template #items>
          <KDropdownItem
            @click="handleOpen"
          >
            {{ t('plugins.free-form.datakit.flow_editor.panel_segments.resources.vault.edit') }}
          </KDropdownItem>
          <KDropdownItem
            danger
            @click="handleRemove"
          >
            {{ t('plugins.free-form.datakit.flow_editor.panel_segments.resources.vault.delete') }}
          </KDropdownItem>
        </template>
      </KDropdown>
    </div>

    <KButton
      v-else
      appearance="tertiary"
      class="add-button"
      size="small"
      @click="handleAdd"
    >
      <AddIcon />
      {{ t('plugins.free-form.datakit.flow_editor.panel_segments.resources.cache.add_button') }}
    </KButton>

    <KModal
      :action-button-disabled="!canSubmit"
      :action-button-text="t('actions.save')"
      max-width="640px"
      :title="t('plugins.free-form.datakit.flow_editor.panel_segments.resources.cache.title')"
      :visible="modalVisible"
      @cancel="handleCancel"
      @proceed="handleSave"
    >
      <div class="dk-resource-cache-form">
        <RadioField
          :items="[
            { label: t('plugins.free-form.datakit.flow_editor.panel_segments.resources.cache.strategy_options.memory'), value: 'memory' },
            { label: t('plugins.free-form.datakit.flow_editor.panel_segments.resources.cache.strategy_options.redis'), value: 'redis' },
          ]"
          name="strategy"
          @update:model-value="handleStrategyChange"
        />

        <Field
          v-if="localStrategy === 'memory'"
          name="memory.dictionary_name"
        />

        <div
          v-if="localStrategy === 'redis' && enableRedisPartial"
        >
          <KLabel>
            {{ t('plugins.free-form.datakit.flow_editor.panel_segments.resources.cache.select_redis_configuration') }}
          </KLabel>

          <RedisConfigurationSelector
            :model-value="formData.cache?.partial_id"
            redis-type="redis-ee"
            @update:model-value="data => formData.cache!.partial_id = data"
          />
        </div>

        <div
          v-if="localStrategy === 'redis' && enableRedisPartial && !formData.cache?.partial_id && redisConfigYaml"
          class="dk-cache-inline-redis"
        >
          <div>{{ t('plugins.free-form.datakit.flow_editor.panel_segments.resources.cache.inline_config_preview') }}</div>
          <KCodeBlock
            id="dk-cache-redis-configuration"
            :code="redisConfigYaml"
            language="yaml"
            theme="dark"
            @code-block-render="highlight"
          />
        </div>

        <div
          v-if="localStrategy === 'redis' && !enableRedisPartial"
          class="dk-cache-redis-editor"
        >
          <KLabel>
            {{ t('plugins.free-form.datakit.flow_editor.panel_segments.resources.cache.inline_config') }}
          </KLabel>
          <MonacoEditor
            v-model="redisYaml"
            appearance="standalone"
            class="redis-editor"
            language="yaml"
            theme="light"
          />
          <p
            v-if="redisYamlError"
            class="redis-editor-error"
          >
            {{ redisYamlError }}
          </p>
        </div>
      </div>
    </KModal>
  </div>
</template>

<script setup lang="ts">
import { computed, inject, ref, shallowRef, watch } from 'vue'
import yaml from 'js-yaml'
import { codeToHtml } from 'shiki'
import {
  KUI_COLOR_TEXT_NEUTRAL,
  KUI_COLOR_TEXT,
  KUI_ICON_SIZE_30,
} from '@kong/design-tokens'
import { AddIcon, DatabaseIcon, MoreIcon } from '@kong/icons'
import {
  RedisConfigurationSelector,
} from '@kong-ui-public/entities-redis-configurations'
import { MonacoEditor } from '@kong-ui-public/monaco-editor'
import '@kong-ui-public/monaco-editor/dist/runtime/style.css'
import { REDIS_PARTIAL_INFO } from '../../../../shared/const'
import composables from '../../../../../../composables'
import Field from '../../../../shared/Field.vue'
import RadioField from '../../../../shared/RadioField.vue'
import { useField, useFormShared } from '../../../../shared/composables'

import type { CodeBlockEventData } from '@kong/kongponents'
import type { CacheConfigFormData } from '../../types'

const DEFAULT_REDIS_YAML = yaml.dump({ host: '127.0.0.1', port: 6379 }, { indent: 2 })

export type FormData = { cache?: CacheConfigFormData | null }

defineProps<{
  strategy?: CacheConfigFormData['strategy']
}>()

const emit = defineEmits<{
  'update': [config: FormData]
  'remove': []
  'cancel': []
}>()

const { getDefault, formData } = useFormShared<FormData>()
const field = useField<FormData['cache']>('cache')

if (field.error) throw new Error('No cache schema')

const redisPartialInfo = inject(REDIS_PARTIAL_INFO)
const enableRedisPartial = computed(() => !!redisPartialInfo)

const redisYaml = shallowRef('')
const redisYamlError = ref('')

const modalVisible = ref(false)
const { i18n: { t } } = composables.useI18n()
const canSubmit = computed(() => {
  if (localStrategy.value === 'redis') {
    if (enableRedisPartial.value) {
      return !!(formData.cache?.partial_id || formData.cache?.redis)
    }
    return !!formData.cache?.redis && !redisYamlError.value
  }
  return true
})

const localStrategy = computed(() => field.value.value?.strategy)

const redisConfigYaml = computed(() => {
  if (!field.value.value?.redis) return ''
  return yaml.dump(field.value.value.redis, {
    indent: 2,
    noRefs: true,
  })
})

// Initialize the editor content when the modal opens or when switching to redis strategy
watch([modalVisible, localStrategy], ([visible, strategy]) => {
  if (visible && strategy === 'redis' && !enableRedisPartial.value) {
    redisYaml.value = redisConfigYaml.value || DEFAULT_REDIS_YAML
    redisYamlError.value = ''
  }
})

// Parse YAML and update formData on editor changes
watch(redisYaml, (yamlStr) => {
  if (!enableRedisPartial.value && localStrategy.value === 'redis') {
    try {
      const parsed = yaml.load(yamlStr, { json: true })
      if (parsed && typeof parsed === 'object') {
        formData.cache!.redis = parsed as CacheConfigFormData['redis']
        redisYamlError.value = ''
      }
    } catch (e: unknown) {
      redisYamlError.value = ((e as Error).message?.split('\n')[0]) || 'Invalid YAML'
    }
  }
})

const handleOpen = () => {
  modalVisible.value = true
}

const handleCancel = () => {
  modalVisible.value = false
  emit('cancel')
}

const handleRemove = () => {
  emit('remove')
}

const handleAdd = () => {
  handleOpen()
  if (!field.value.value) {
    field.value.value = getDefault('cache')
    // Set default strategy to memory
    field.value.value!.strategy = 'memory'
  }
}

const handleSave = () => {
  modalVisible.value = false
  emit('update', formData)
}

// This is intended to clear partial_id when switching to memory strategy
const handleStrategyChange = () => {
  if (localStrategy.value === 'memory' && formData.cache?.partial_id) {
    delete formData.cache?.partial_id
  }
}

async function highlight({ codeElement, language, code }: CodeBlockEventData) {
  codeElement.innerHTML = await codeToHtml(code, {
    lang: language,
    theme: 'material-theme-darker',
    structure: 'inline',
  })
}
</script>

<style lang="scss" scoped>
.dk-cache-panel {
  .add-button {
    margin-top: var(--kui-space-40, $kui-space-40);
  }

  .cache-item {
    align-items: center;
    display: flex;
    justify-content: space-between;
    padding: 0 var(--kui-space-20, $kui-space-20);

    .cache-item-key {
      align-items: center;
      display: flex;
      gap: var(--kui-space-20, $kui-space-20);
      overflow: hidden;

      &-text {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }
  }
}

.dk-resource-cache-form {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-70, $kui-space-70);

  &-field {
    display: flex;
    flex-direction: column;
  }

  .dk-cache-inline-redis {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-20, $kui-space-20);
  }

  .dk-cache-redis-editor {
    display: flex;
    flex-direction: column;
    gap: var(--kui-space-20, $kui-space-20);

    .redis-editor {
      height: 200px;
      width: 100%;
    }

    .redis-editor-error {
      color: var(--kui-color-text-danger, $kui-color-text-danger);
      font-size: var(--kui-font-size-20, $kui-font-size-20);
      margin: 0;
    }
  }
}
</style>
