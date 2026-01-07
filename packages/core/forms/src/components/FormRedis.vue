<template>
  <div>
    <div v-if="isCustomPlugin">
      <KAlert
        data-testid="custom-plugin-redis-config-note"
        :message="t('redis.custom_plugin.alert')"
      />
      <RedisConfigSelect
        :default-redis-config-item="selectedRedisConfigItem"
        is-custom-plugin
        :plugin-redis-fields="field.fields"
        :update-redis-model="updateRedisModel"
        @show-new-partial-modal="$emit('showNewPartialModal')"
      />
    </div>
    <KCard
      v-else
      class="redis-config-card"
      data-testid="redis-config-card"
      :title="t('redis.title')"
    >
      <div
        class="redis-config-radio-group"
        data-testid="redis-config-radio-group"
      >
        <KRadio
          v-model="usePartial"
          card
          card-orientation="horizontal"
          data-testid="shared-redis-config-radio"
          :description="t('redis.shared_configuration.description')"
          :label="t('redis.shared_configuration.label')"
          :selected-value="true"
        >
          <KBadge appearance="success">
            {{ t('redis.shared_configuration.badge') }}
          </KBadge>
        </KRadio>
        <KRadio
          v-model="usePartial"
          card
          card-orientation="horizontal"
          data-testid="dedicated-redis-config-radio"
          :description="t('redis.dedicated_configuration.description')"
          :label="t('redis.dedicated_configuration.label')"
          :selected-value="false"
        />
      </div>
      <div
        v-if="usePartial"
        class="shared-redis-config"
      >
        <RedisConfigSelect
          :default-redis-config-item="selectedRedisConfigItem"
          :plugin-redis-fields="field.fields"
          :redis-type="field.redisType"
          :update-redis-model="updateRedisModel"
          @show-new-partial-modal="$emit('showNewPartialModal')"
        />
      </div>
      <div
        v-else
        class="dedicated-redis-config"
      >
        <div class="dedicated-redis-config-title">
          {{ t('redis.dedicated_configuration.title') }}
        </div>
        <component
          :is="tag"
        >
          <template
            v-for="subfield in field.fields"
            :key="subfield.model"
          >
            <form-group
              v-if="fieldVisible(subfield)"
              ref="children"
              :errors="errors"
              :field="subfield"
              :model="model"
              :options="options"
              :vfg="vfg"
              @model-updated="onModelUpdated"
              @refresh-model="onRefreshModel"
              @validated="onFieldValidated"
            />
          </template>
        </component>
      </div>
    </KCard>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeMount, ref, watch, type PropType } from 'vue'
import formGroup from './FormGroup.vue'
import RedisConfigSelect from './RedisConfigSelect.vue'

import isFunction from 'lodash-es/isFunction'
import isNil from 'lodash-es/isNil'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../locales/en.json'
import type { FormRedisFields } from '../types'

const props = defineProps({
  tag: {
    type: String,
    default: 'fieldset',
    validator: function(value: string): boolean {
      return value.length > 0
    },
  },
  model: {
    type: Object,
    default: () => undefined,
  },
  options: {
    type: Object,
    required: true,
  },
  field: {
    type: Object as PropType<FormRedisFields>,
    required: true,
  },
  vfg: {
    type: Object,
    required: true,
  },
  /**
   * TODO: stronger type
   */
  errors: {
    type: Array,
    default() {
      return []
    },
  },
  redisPath: {
    type: String,
    default: undefined,
    required: false,
  },
  isEditing: {
    type: Boolean,
    default: false,
  },
})

const emits = defineEmits<{
  (e: 'modelUpdated', payload: any, schema: string): void
  (e: 'partialToggled', field: string, model: Record<string, any>): void
  (e: 'showNewPartialModal'): void
  (e: 'refreshModel'): void
  (e: 'validated', res: boolean, errors: any[], field: any): void
}>()

const { t } = createI18n<typeof english>('en-us', english)

// if the plugin is custom, show redis configuration selector instead of the whole card
const isCustomPlugin = computed(() => props.field.pluginType === 'custom')
const usePartial = ref(!props.isEditing)
const selectedRedisConfigItem = ref()

const redisFieldsSaved = ref<Record<string, any>>({})
const partialsSaved = ref<Array<{ id: string | number, path: string | undefined }> | undefined>()

const fieldVisible = (field: any) => {
  if (isFunction(field.visible)) {
    return field.visible.call(this, props.model, field, this)
  }

  if (isNil(field.visible)) {
    return true
  }
  return field.visible
}

const updateRedisModel = async (val: string | number) => {
  emits('modelUpdated', [{ id: val, path: props.redisPath }], 'partials')
  partialsSaved.value = [{ id: val, path: props.redisPath }]
  selectedRedisConfigItem.value = val
}

const onModelUpdated = (model: any, schema: string) => {
  redisFieldsSaved.value = { ...redisFieldsSaved.value, [schema]: model }
  emits('modelUpdated', model, schema)
}

const onRefreshModel = () => {
  // This is for updating a deeply nested array element
  // See `modelUpdated` in `FieldArray.vue`
  emits('refreshModel')
}

// Child field executed validation
const onFieldValidated = (res: boolean, errors: any[], field: any) => {
  emits('validated', res, errors, field)
}

watch(() => usePartial.value, (usePartial) => {
  if (usePartial) {
    // only pass partialToggled to parent if some partials are selected
    // when no partials are selected, no change of form model will happen, form will keep redis fields as default until a partial is selected
    // see getRequestBidy in PluginForm
    if (partialsSaved.value) {
      emits('partialToggled', 'redis', { 'partials': partialsSaved.value })
    }
  } else {
    emits('partialToggled', 'partials', redisFieldsSaved.value)
  }
})

// fetch available redis configs under the control plane
onBeforeMount(() => {
  if (props.model) {
    redisFieldsSaved.value = props.field.fields.reduce((acc: Record<string, any>, field: { model: string }) => {
      if (Object.keys(props.model!).includes(field.model)) {
        acc[field.model] = props.model![field.model]
      }
      return acc
    }, {})
  }
  if (props?.model?.partials?.[0]?.id) {
    const selectedPartialId = props.model.partials[0].id
    usePartial.value = true
    selectedRedisConfigItem.value = selectedPartialId
  }
})

</script>

<style lang="scss" scoped>
.redis-config-card {
  margin-bottom: var(--kui-space-60, $kui-space-60);

  :deep(.form-group:last-child) {
    margin-bottom: 0;
  }
}

.dedicated-redis-config {
  margin-top: var(--kui-space-60, $kui-space-60);

  .dedicated-redis-config-title {
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    font-weight: var(--kui-font-weight-bold, $kui-font-weight-bold);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    margin-bottom: var(--kui-space-60, $kui-space-60);
  }
}

.redis-config-radio-group {
  display: flex;
  gap: var(--kui-space-40, $kui-space-40);
  margin-bottom: var(--kui-space-40, $kui-space-40);
}
</style>
