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
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="KUI_ICON_SIZE_30"
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
          <MoreIcon :color="KUI_COLOR_TEXT" />
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

        <div v-if="localStrategy === 'redis'">
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
          v-if="localStrategy === 'redis' && !formData.cache?.partial_id && redisConfigYaml"
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
      </div>
    </KModal>
  </div>
</template>

<script setup lang="ts">
import {
  KUI_ICON_SIZE_30,
} from '@kong/design-tokens'
import composables from '../../../../../composables'
import { AddIcon, DatabaseIcon, MoreIcon } from '@kong/icons'
import type { CacheConfigFormData } from '../../types'
import Field from '../../../shared/Field.vue'
import RadioField from '../../../shared/RadioField.vue'
import { computed, ref } from 'vue'
import { useField, useFormShared } from '../../../shared/composables'
import {
  KUI_COLOR_TEXT_NEUTRAL,
  KUI_COLOR_TEXT,
} from '@kong/design-tokens'
import {
  RedisConfigurationSelector,
} from '@kong-ui-public/entities-redis-configurations'
import yaml from 'js-yaml'
import { createSingletonShorthands, createdBundledHighlighter } from '@shikijs/core'
import { createJavaScriptRegexEngine } from '@shikijs/engine-javascript'
import type { CodeBlockEventData } from '@kong/kongponents'

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

const modalVisible = ref(false)
const { i18n: { t } } = composables.useI18n()
const canSubmit = computed(() => {
  if (localStrategy.value === 'redis' && !formData.cache!.partial_id && !formData.cache!.redis) {
    return false
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

const createHighlighter = createdBundledHighlighter({
  langs: {
    yaml: () => import('@shikijs/langs/yaml'),
  },
  themes: {
    'github-dark': () => import('@shikijs/themes/github-dark'),
  },
  engine: () => createJavaScriptRegexEngine(),
})

const {
  codeToHtml,
} = createSingletonShorthands(
  createHighlighter,
)

// This is intended to clear partial_id when switching to memory strategy
const handleStrategyChange = () => {
  if (localStrategy.value === 'memory' && formData.cache?.partial_id) {
    delete formData.cache?.partial_id
  }
}

async function highlight({ codeElement, language, code }: CodeBlockEventData) {
  codeElement.innerHTML = await codeToHtml(code, {
    lang: language,
    theme: 'github-dark',
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
}
</style>
