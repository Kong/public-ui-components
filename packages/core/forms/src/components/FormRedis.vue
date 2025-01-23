<template>
  <div>
    <div v-if="isCustomPlugin">
      <KAlert :message="t('redis.custom_plugin.alert')" />
      <RedisConfigSelect
        :default-redis-config-item="selectedRedisConfigItem"
        :plugin-redis-fields="field.fields"
        :update-redis-model="updateRedisModel"
      />
    </div>
    <KCard
      v-else
      class="redis-config-card"
      :title="t('redis.title')"
    >
      <div class="redis-config-radio-group">
        <KRadio
          v-model="usePartial"
          card
          card-orientation="horizontal"
          data-testid="shared-redis-config"
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
          :update-redis-model="updateRedisModel"
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
            v-for="field in field.fields"
            :key="field.model"
          >
            <form-group
              v-if="fieldVisible(field)"
              ref="children"
              :errors="errors"
              :field="field"
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
import { computed, onBeforeMount, ref, watch } from 'vue'
import formGroup from './FormGroup.vue'
import RedisConfigSelect from './RedisConfigSelect.vue'

import isFunction from 'lodash-es/isFunction'
import isNil from 'lodash-es/isNil'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../locales/en.json'

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
    type: Object,
    required: true,
  },
  vfg: {
    type: Object,
    required: true,
  },
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
})

const emits = defineEmits<{
  (e: 'modelUpdated', payload: any, schema: any): void,
  (e: 'partialToggled', field: string, model: any): void,
  (e: 'showNewPartialModal'): void,
  (e: 'refreshModel'): void,
  (e: 'validated', res: boolean, errors: any[], field: any): void,
}>()

const { t } = createI18n<typeof english>('en-us', english)

// if the plugin is custom, show redis configuration selector instead of the whole card
const isCustomPlugin = computed(() => props.field.pluginType === 'custom')
const usePartial = ref(false)
const selectedRedisConfigItem = ref()

const redisFieldsSaved = ref([] as { model: any; schema: any }[])
const partialsSaved = ref()

const fieldVisible = (field: any) => {
  if (isFunction(field.visible)) return field.visible.call(this, props.model, field, this)

  if (isNil(field.visible)) return true

  return field.visible
}

const updateRedisModel = async (val: string | number | undefined) => {
  emits('modelUpdated', [{ id: val, path: props.redisPath }], 'partials')
  partialsSaved.value = [{ id: val, path: props.redisPath }]
}

const onModelUpdated = (model: any, schema: any) => {
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
    emits('partialToggled', 'redis', { 'partials': partialsSaved.value })
  } else {
    emits('partialToggled', 'partials', redisFieldsSaved.value)
  }
})

// fetch available redis configs under the control plane
onBeforeMount(async () => {
  redisFieldsSaved.value = props.field.fields.reduce((acc: Record<string,any>, field: { model: string }) => {
    if (Object.keys(props.model!).includes(field.model)) {
      acc[field.model] = props.model![field.model]
    }
    return acc
  }, {})
  if (props?.model?.partials?.[0]?.id) {
    const selectedPartialId = props.model.partials[0].id
    usePartial.value = true
    selectedRedisConfigItem.value = selectedPartialId
  }
})

</script>

<style lang="scss" scoped>
.redis-config-card {
  margin-bottom: $kui-space-60;

  :deep(.form-group:last-child) {
    margin-bottom: 0;
  }
}

.dedicated-redis-config {
  margin-top: $kui-space-60;

  .dedicated-redis-config-title {
    font-size: $kui-font-size-40;
    font-weight: $kui-font-weight-bold;
    line-height: $kui-line-height-30;
    margin-bottom: $kui-space-60;
  }
}

.redis-config-radio-group {
  display: flex;
  gap: $kui-space-40;
  margin-bottom: $kui-space-40;
}
</style>
