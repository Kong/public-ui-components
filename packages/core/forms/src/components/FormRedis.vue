<template>
  <KCard
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
          Recommended
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
      <h3>{{ t("redis.shared_configuration.title") }}</h3>
      <KSelect
        v-model="selectedRedisConfigItem"
        data-testid="redis-config-select"
        :items="availableRedisConfigs"
        :loading="loadingRedisConfigs"
        :placeholder="t('redis.shared_configuration.selector.placeholder')"
        @change="redisConfigSelected"
        @query-change="debouncedRedisConfigsQuery"
      >
        <template #empty>
          <div class="empty-redis-config">
            {{ t('redis.shared_configuration.empty_state') }}
          </div>
        </template>
        <template #dropdown-footer-text>
          <div
            class="new-redis-config-area"
            @click="newRedisConfigurationModal = true"
          >
            <AddIcon :size="KUI_ICON_SIZE_20" />
            <span>{{ t('redis.shared_configuration.create_new_configuration') }}</span>
          </div>
        </template>
      </KSelect>
      <RedisConfigCard
        v-if="selectedRedisConfig"
        :config-fields="selectedRedisConfig"
        :plugin-redis-fields="field.fields"
      />
    </div>
    <div
      v-else
      class="shared-redis-config"
    >
      <h3>{{ t('redis.dedicated_configuration.title') }}</h3>
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
</template>

<script setup lang="ts">
import {
  useAxios,
  useDebouncedFilter,
  type KongManagerBaseFormConfig,
  type KongManagerBaseTableConfig,
  type KonnectBaseFormConfig,
  type KonnectBaseTableConfig,
} from '@kong-ui-public/entities-shared'
import type { SelectItem } from '@kong/kongponents'
import { AddIcon } from '@kong/icons'
import { KUI_ICON_SIZE_20 } from '@kong/design-tokens'
import type { PropType } from 'vue'
import { computed, onBeforeMount, ref, inject, watch } from 'vue'
import formGroup from './FormGroup.vue'
import RedisConfigCard from './RedisConfigCard.vue'

import isFunction from 'lodash-es/isFunction'
import isNil from 'lodash-es/isNil'
import { createI18n } from '@kong-ui-public/i18n'
import english from '../locales/en.json'
import { FORMS_CONFIG } from '../const'

const formConfig : KonnectBaseFormConfig | KongManagerBaseFormConfig | KonnectBaseTableConfig | KongManagerBaseTableConfig | undefined = inject(FORMS_CONFIG)

const endpoints = {
  konnect: '/v2/control-planes/{controlPlaneId}/core-entities/partials',
  kongManager: '/{workspace}/partials',
}

const props = defineProps({
  config: {
    type: Object as PropType<any>,
    required: true,
    validator: (): boolean => {
      return true
    },
  },
  usePartial: {
    type: Boolean,
    default: false,
  },
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
})

const emits = defineEmits<{
  (e: 'modelUpdated', payload: any, schema: any): void,
  (e: 'partialToggled', field: string, model: any): void,
  (e: 'refreshModel'): void,
  (e: 'validated', res: boolean, errors: any[], field: any): void,
}>()

const { t } = createI18n<typeof english>('en-us', english)

const usePartial = ref(props.usePartial)
const selectedRedisConfigItem = ref()
const selectedRedisConfig = ref(null)
const newRedisConfigurationModal = ref(false)
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)

const redisFieldsSaved = ref([] as { model: any; schema: any }[])
const partialsSaved = ref()

const fieldVisible = (field: any) => {
  if (isFunction(field.visible)) return field.visible.call(this, props.model, field, this)

  if (isNil(field.visible)) return true

  return field.visible
}

const redisConfigSelected = async (item: SelectItem | null) => {
  // selector cleared
  if (!item) return

  emits('modelUpdated', [{ id: item.value }], 'partials')
  partialsSaved.value = [{ id: item.value }]
  //
  try {
    const configRes = await axiosInstance.get(`/partials/${item.value}`)
    configRes.data = {
      'database': 0,
      'host': null,
      'password': '1111',
      'port': 637,
      'server_name': null,
      'ssl': false,
      'ssl_verify': false,
      'timeout': 2000,
      'username': null,
    }
    selectedRedisConfig.value = configRes.data
  } catch (error) {
    console.error(error)
  }
}

const {
  debouncedQueryChange: debouncedRedisConfigsQuery,
  loading: loadingRedisConfigs,
  // error: redisConfigsFetchError,
  loadItems: loadConfigs,
  results: redisConfigsResults,
} = useDebouncedFilter(formConfig!, endpoints[formConfig!.app], undefined, {
  fetchedItemsKey: 'data',
  searchKeys: ['id', 'name'],
})

const availableRedisConfigs = computed((): SelectItem[] => redisConfigsResults.value?.map(el => ({ label: el.id, name: el.name, value: el.id })))

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
  await loadConfigs()
})

</script>

<style lang="scss">
.redis-config-card {
  margin-bottom: $kui-space-60;
  .empty-redis-config {
    color: $kui-color-text-neutral;
  }
  .new-redis-config-area {
    align-items: center;
    color: $kui-color-text-primary;
    cursor: pointer;
    display: flex;
    gap: $kui-space-10;
    pointer-events: auto;
  }
  :deep(.form-group:last-child) {
    margin-bottom: 0;
  }
}

.redis-config-title {
  margin-block-start: 0;
}

.redis-config-radio-group {
  display: flex;
  gap: $kui-space-40;
  margin-bottom: $kui-space-40;
}
</style>
