<template>
  <div>
    <VueFormGenerator
      v-if="formModel.id && isEditing || !isEditing"
      class="global-fields"
      :model="formModel"
      :options="formOptions"
      :schema="globalFields"
      @model-updated="onModelUpdated"
    />

    <KTabs :tabs="tabs">
      <template #general>
        <div class="general-settings">
          <div class="header-wrapper">
            <span class="section-header">General Configuration Settings</span>
          </div>
          <div class="description">
            Parameters for enabling the ACME plugin.
          </div>

          <VueFormGenerator
            v-if="displayForm"
            :model="formModel"
            :options="formOptions"
            :schema="commonFieldsSchema"
            @model-updated="onModelUpdated"
          />

          <hr>

          <KSelect
            class="issuer-select"
            :items="items"
            label="Issuer"
            @change="onChange"
          />

          <div class="sub-form">
            <VueFormGenerator
              v-if="selectedIssuer === 'letsEncrypt'"
              :model="formModel"
              :options="formOptions"
              :schema="acmeLetsEncryptSchema"
              @model-updated="onModelUpdated"
            />

            <VueFormGenerator
              v-if="selectedIssuer === 'zeroSsl' || selectedIssuer === 'other'"
              :model="formModel"
              :options="formOptions"
              :schema="acmeZeroSSLSchema"
              @model-updated="onModelUpdated"
            />
          </div>
        </div>
      </template>

      <template #storage>
        <div class="general-settings">
          <div class="header-wrapper">
            <span class="section-header">Storage Configuration Settings</span>
          </div>
          <div class="description">
            Parameters for setting up storage.
          </div>

          <VueFormGenerator
            v-if="displayForm"
            :model="formModel"
            :options="formOptions"
            :schema="storageFieldsSchema"
            @model-updated="onChangeStorage"
          />

          <div class="sub-form">
            <VueFormGenerator
              v-if="selectedStorageConfig === 'consul'"
              :model="formModel"
              :options="formOptions"
              :schema="storageConsulFieldsSchema"
              @model-updated="onModelUpdated"
            />

            <VueFormGenerator
              v-if="selectedStorageConfig === 'redis'"
              :model="formModel"
              :options="formOptions"
              :schema="storageRedisFieldsSchema"
              @model-updated="onModelUpdated"
            />

            <VueFormGenerator
              v-if="selectedStorageConfig === 'shm'"
              :model="formModel"
              :options="formOptions"
              :schema="storageShmFieldsSchema"
              @model-updated="onModelUpdated"
            />

            <VueFormGenerator
              v-if="selectedStorageConfig === 'vault'"
              :model="formModel"
              :options="formOptions"
              :schema="storageVaultFieldsSchema"
              @model-updated="onModelUpdated"
            />
          </div>
        </div>
      </template>

      <template #advanced>
        <div class="general-settings">
          <div class="header-wrapper">
            <span class="section-header">Advanced Configuration Settings</span>
          </div>
          <div class="description">
            Advanced parameters for manually configuring the ACME plugin.
          </div>
          <VueFormGenerator
            v-if="displayForm"
            :model="formModel"
            :options="formOptions"
            :schema="advancedFieldsSchema"
            @model-updated="onModelUpdated"
          />
        </div>
      </template>
    </KTabs>
  </div>
</template>

<script setup lang="ts">
import cloneDeep from 'lodash-es/cloneDeep'
import type { PropType } from 'vue'
import { computed, onMounted, provide, ref, useSlots } from 'vue'
import { AUTOFILL_SLOT, AUTOFILL_SLOT_NAME } from '../../const'
import type { AutofillSlot } from '../../types'
import VueFormGenerator from '../FormGenerator.vue'
import type { Schema } from './schemas/ACMECommon'
import { ACMECommonSchema, ACMELetsEncryptSchema, ACMEZeroSSLSchema } from './schemas/ACMECommon'

// Provide AUTOFILL_SLOT
provide<AutofillSlot | undefined>(AUTOFILL_SLOT, useSlots()?.[AUTOFILL_SLOT_NAME])

const props = defineProps({
  formModel: {
    type: Object as PropType<any>,
    required: true,
  },
  formSchema: {
    type: Object as PropType<any>,
    required: true,
  },
  formOptions: {
    type: Object as PropType<any>,
    default: () => {},
  },
  onModelUpdated: {
    type: Function as PropType<() => void>,
    required: true,
  },
  isEditing: {
    type: Boolean,
    required: true,
  },
})

const selectedIssuer = ref<string>('zeroSsl')
const selectedStorageConfig = ref<string>('shm')

const formFieldMap = computed(() => {
  const fieldMap: Record<string, any> = {}

  if (props.formSchema?.fields) {
    for (const field of props.formSchema.fields) {
      fieldMap[field.model] = field
    }
  }

  return fieldMap
})

const acmeCommonSchema = computed<Schema>(() => {
  const schema = cloneDeep(ACMECommonSchema)
  for (const field of schema.fields) {
    const help = formFieldMap.value[field.model]?.help
    if (field.help === undefined && typeof help === 'string') {
      field.help = help
    }
  }
  return schema
})

const acmeLetsEncryptSchema = computed<Schema>(() => {
  const schema = cloneDeep(ACMELetsEncryptSchema)
  for (const field of schema.fields) {
    const help = formFieldMap.value[field.model]?.help
    if (field.help === undefined && typeof help === 'string') {
      field.help = help
    }
  }
  return schema
})

const acmeZeroSSLSchema = computed<Schema>(() => {
  const schema = cloneDeep(ACMEZeroSSLSchema)
  for (const field of schema.fields) {
    const help = formFieldMap.value[field.model]?.help
    if (field.help === undefined && typeof help === 'string') {
      field.help = help
    }
  }
  return schema
})

const globalFields = computed(() => {
  return {
    fields: props.formSchema.fields.filter((r: any) => {
      return !r.model.startsWith('config') && r.model !== 'tags'
    }),
  }
})

const commonFieldsSchema = computed(() => {
  const result = acmeCommonSchema.value.fields.filter((item) =>
    !acmeLetsEncryptSchema.value.fields.some((i) => i.model === item.model) &&
    !acmeZeroSSLSchema.value.fields.some((i) => i.model === item.model),
  )

  return {
    fields: result,
  }
})

const storageFieldsSchema = computed(() => {
  const result = props.formSchema.fields.filter((r: any) => {
    return r.model.startsWith('config-storage') &&
      !r.model.startsWith('config-storage_config-consul') &&
      !r.model.startsWith('config-storage_config-redis') &&
      !r.model.startsWith('config-storage_config-shm') &&
      !r.model.startsWith('config-storage_config-vault')
  })

  return {
    fields: result,
  }
})

const storageConsulFieldsSchema = computed(() => {
  const result = props.formSchema.fields.filter((r: any) => {
    return r.model.startsWith('config-storage_config-consul')
  })

  return {
    fields: result,
  }
})

const storageRedisFieldsSchema = computed(() => {
  const result = props.formSchema.fields.filter((r: any) => {
    return r.model.startsWith('config-storage_config-redis')
  })

  return {
    fields: result,
  }
})

const storageShmFieldsSchema = computed(() => {
  const result = props.formSchema.fields.filter((r: any) => {
    return r.model.startsWith('config-storage_config-shm')
  })

  return {
    fields: result,
  }
})

const storageVaultFieldsSchema = computed(() => {
  const result = props.formSchema.fields.filter((r: any) => {
    return r.model.startsWith('config-storage_config-vault')
  })

  return {
    fields: result,
  }
})

const advancedFieldsSchema = computed(() => {
  return {
    fields: props.formSchema.fields.filter((r: any) => {
      return (r.model.startsWith('config') && !commonFieldsSchema.value.fields.filter(field => {
        return field.model === r.model
      }).length && !storageFieldsSchema.value.fields.filter((field: any) => {
        return field.model === r.model
      }).length) || r.model === 'tags'
    }),
  }
})

const displayForm = computed<string>(() => (props.formModel.id && props.isEditing) || !props.isEditing)

const tabs = [
  {
    hash: '#general',
    title: 'General',
  },
  {
    hash: '#storage',
    title: 'Storage',
  },
  {
    hash: '#advanced',
    title: 'Advanced',
  },
]

const items = [
  {
    label: 'Lets Encrypt',
    value: 'letsEncrypt',
  },
  {
    label: 'Zero SSL',
    value: 'zeroSsl',
    selected: true,
  },
  {
    label: 'Other',
    value: 'other',
  },
]

onMounted(() => {
  if (selectedIssuer.value === 'zeroSsl') {
    // eslint-disable-next-line vue/no-mutating-props
    props.formModel['config-api_uri'] = 'https://acme.zerossl.com/v2/DV90'
  }
})

const onChange = (payload: any) => {
  selectedIssuer.value = payload.value

  if (payload.value === 'zeroSsl' || payload.value === 'other') {
    if (payload.value === 'zeroSsl') {
      // eslint-disable-next-line vue/no-mutating-props
      props.formModel['config-api_uri'] = 'https://acme.zerossl.com/v2/DV90'
    } else {
      // eslint-disable-next-line vue/no-mutating-props
      props.formModel['config-api_uri'] = 'https://acme.example.com/'
    }

    // reset LetsEncrypt values
    // eslint-disable-next-line vue/no-mutating-props
    props.formModel['config-tos_accepted'] = false
  }

  if (payload.value === 'letsEncrypt') {
    // eslint-disable-next-line vue/no-mutating-props
    props.formModel['config-api_uri'] = 'https://acme-v02.api.letsencrypt.org/directory'

    // reset ZeroSSL values
    // eslint-disable-next-line vue/no-mutating-props
    props.formModel['config-eab_hmac_key'] = ''
    // eslint-disable-next-line vue/no-mutating-props
    props.formModel['config-eab_kid'] = ''
  }

  props.onModelUpdated()
}

const onChangeStorage = (payload: string, schema: string): void => {
  if (schema === 'config-storage') {
    selectedStorageConfig.value = payload
  }

  props.onModelUpdated()
}
</script>

<style lang="scss" scoped>
.issuer-select {
  margin-bottom: 16px;
  width: 100%;
}

.header-wrapper {
  margin-bottom: 8px;
}

.sub-form {
  margin-left: 24px;
}

.description {
  margin-bottom: 12px;
}

:deep(.k-tabs ul[role="tablist"]) {
  margin-bottom: 32px;
}
</style>
