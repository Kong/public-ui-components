<template>
  <EntityFormSection
    class="kong-ui-entities-upstreams-general-info"
    :description="t('upstreams.form.general_info.help')"
    :title="t('upstreams.form.general_info.title')"
  >
    <KSkeleton
      v-if="loader"
      type="form"
    />

    <div v-else>
      <KSelect
        class="name-select margin-bottom-6"
        clearable
        data-testid="upstreams-form-name"
        enable-filtering
        enable-item-creation
        :filter-function="() => true"
        :items="displayedHosts"
        :label="t('upstreams.form.fields.name.label')"
        :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
        :loading="hostLoading"
        :model-value="localNameId"
        :placeholder="t('upstreams.form.fields.name.placeholder')"
        :readonly="readonly"
        required
        width="100%"
        @item-added="onAddItem"
        @item-removed="onRemoveItem"
        @query-change="onHostQueryChange"
        @update:model-value="(onUpdateName as any)"
      >
        <template #label-tooltip>
          <i18nT
            keypath="upstreams.form.fields.name.tooltip"
            scope="global"
          >
            <template #host>
              <code>{{ t('upstreams.form.fields.name.host') }}</code>
            </template>
          </i18nT>
        </template>
      </KSelect>
      <KInput
        autocomplete="off"
        class="margin-bottom-6"
        data-testid="upstreams-form-host-header"
        :label="t('upstreams.form.fields.host_header.label')"
        :model-value="hostHeader"
        :readonly="readonly"
        type="text"
        @update:model-value="emit('update:host-header', $event)"
      />
      <KSelect
        class="certificate-select margin-bottom-6"
        clearable
        data-testid="upstreams-form-client-certificate"
        enable-filtering
        :filter-function="() => true"
        :items="displayedCertificates"
        :label="t('upstreams.form.fields.client_certificate.label')"
        :label-attributes="{
          info: t('upstreams.form.fields.client_certificate.tooltip'),
          tooltipAttributes: { maxWidth: '400' },
        }"
        :loading="certificateLoading"
        :model-value="clientCertificate"
        :placeholder="t('upstreams.form.fields.client_certificate.placeholder')"
        :readonly="readonly"
        width="100%"
        @query-change="debouncedCertificateCall"
        @update:model-value="emit('update:client-certificate', $event as string)"
      />
      <KInput
        autocomplete="off"
        data-testid="upstreams-form-tags"
        :help="t('upstreams.form.fields.tags.help')"
        :label="t('upstreams.form.fields.tags.label')"
        :label-attributes="{
          info: t('upstreams.form.fields.tags.tooltip'),
          tooltipAttributes: { maxWidth: '400' },
        }"
        :model-value="tags"
        :placeholder="t('upstreams.form.fields.tags.placeholder')"
        :readonly="readonly"
        type="text"
        @update:model-value="emit('update:tags', $event)"
      />
    </div>
  </EntityFormSection>
</template>

<script lang="ts" setup>
import {
  EntityFormSection, useDebouncedFilter,
} from '@kong-ui-public/entities-shared'
import composables from '../composables'
import endpoints from '../upstreams-endpoints'
import type { PropType } from 'vue'
import { computed, onBeforeMount, ref } from 'vue'
import type { KongManagerUpstreamsFormConfig, KonnectUpstreamsFormConfig } from '../types'
import type { SelectItem } from '@kong/kongponents'

const { i18nT, i18n: { t } } = composables.useI18n()

const props = defineProps({
  config: {
    type: Object as PropType<KonnectUpstreamsFormConfig | KongManagerUpstreamsFormConfig>,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  hostHeader: {
    type: String,
    required: true,
  },
  clientCertificate: {
    type: String,
    required: true,
  },
  tags: {
    type: String,
    required: true,
  },
  readonly: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const emit = defineEmits<{
  (e: 'update:name', val: string): void
  (e: 'update:host-header', val: string): void
  (e: 'update:client-certificate', val: string): void
  (e: 'update:tags', val: string): void
}>()

const {
  debouncedQueryChange: debouncedQueryServicesCall,
  loading: hostLoading,
  loadItems: loadHosts,
  results: hostResults,
  allRecords: allServices,
} = useDebouncedFilter(props.config, endpoints.form[props.config?.app]?.getServices, '', {
  fetchedItemsKey: 'data',
  searchKeys: ['host'],
})

const {
  debouncedQueryChange: debouncedCertificateCall,
  loading: certificateLoading,
  loadItems: loadCertificates,
  results: certificateResults,
} = useDebouncedFilter(props.config, endpoints.form[props.config?.app]?.getCertificates)

const hostQuery = ref('')

const isCreatedHost = computed((): boolean => !!props.name && !allServices.value?.some(el => el.host === props.name))

const displayedHosts = computed((): SelectItem[] => {
  const shouldConcatCreatedHost = isCreatedHost.value && props.name.includes(hostQuery.value?.toLowerCase())
  return hostResults.value?.map(el => ({ label: el.host, value: el.id }))
    .concat(
      shouldConcatCreatedHost
        ? [{ label: props.name, value: createdHost.value?.value || props.name }]
        : [],
    )
})

const displayedCertificates = computed((): SelectItem[] => certificateResults.value?.map(el => ({ label: el.id, value: el.id })))

const localNameId = ref<string>('')

const createdHost = ref<SelectItem>({ value: '', label: '' })

const emittedName = computed((): string => displayedHosts.value.find(el => el.value === localNameId.value)?.label || createdHost.value?.label)

const onHostQueryChange = (query: string) => {
  hostQuery.value = query
  debouncedQueryServicesCall(query)
}

const onAddItem = (v: SelectItem) => {
  createdHost.value = v
}

const onRemoveItem = () => {
  createdHost.value = { value: '', label: '' }
}

const onUpdateName = (val: string): void => {
  localNameId.value = val
  emit('update:name', emittedName.value)
}

const loader = ref(false)

onBeforeMount(async () => {
  try {
    loader.value = true

    await loadHosts()
    if (props.name) {
      localNameId.value = displayedHosts.value.find(el => el.label === props.name)?.value?.toString() || props.name
    }
    await loadCertificates()
  } finally {
    loader.value = false
  }
})
</script>

<style scoped lang="scss">
.margin-bottom-6 {
  margin-bottom: var(--kui-space-80, $kui-space-80);
}
</style>
