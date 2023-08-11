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
            appearance="select"
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
              :schema="ACMELetsEncryptSchema"
              @model-updated="onModelUpdated"
            />

            <VueFormGenerator
              v-if="selectedIssuer === 'zeroSsl' || selectedIssuer === 'other'"
              :model="formModel"
              :options="formOptions"
              :schema="ACMEZeroSSLSchema"
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

import VueFormGenerator from '../generator/FormGenerator.vue'
import { computed, onMounted, PropType, ref } from 'vue'
import { ACMECommonSchema, ACMELetsEncryptSchema, ACMEZeroSSLSchema } from './schemas/ACMECommon'

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
    type: Function as PropType<() => {}>,
    required: true,
  },
  isEditing: {
    type: Boolean,
    required: true,
  },
})

const selectedIssuer = ref<string>('zeroSsl')
const selectedStorageConfig = ref<string>('shm')

const globalFields = computed(() => {
  return {
    fields: props.formSchema.fields.filter((r: any) => {
      return !r.model.startsWith('config') && r.model !== 'tags'
    }),
  }
})

const commonFieldsSchema = computed(() => {
  const result = ACMECommonSchema.fields.filter((item) =>
    !ACMELetsEncryptSchema.fields.some((i) => i.model === item.model) &&
    !ACMEZeroSSLSchema.fields.some((i) => i.model === item.model),
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
</style>
