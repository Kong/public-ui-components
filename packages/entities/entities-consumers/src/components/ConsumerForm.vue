<template>
  <div class="kong-ui-entities-consumer-form">
    <EntityBaseForm
      :can-submit="isFormValid && changesExist"
      :config="config"
      :edit-id="consumerId"
      :entity-type="SupportedEntityType.Consumer"
      :error-message="state.errorMessage"
      :fetch-url="fetchUrl"
      :form-fields="payload"
      :is-readonly="state.readonly"
      @cancel="cancelHandler"
      @fetch:error="fetchErrorHandler($event)"
      @fetch:success="updateFormValues"
      @loading="loadingHandler($event)"
      @submit="submitData"
    >
      <div>
        <EntityFormSection
          :description="t('consumers.form.info.description')"
          has-divider
          :title="t('consumers.form.info.title')"
        >
          <div>
            <h3
              :id="`fields-group-title-${uuid}`"
              class="fields-group-title"
            >
              {{ t('consumers.form.consumer_identification.title') }}*
            </h3>
            <p class="fields-group-text">
              {{ t('consumers.form.consumer_identification.description') }}
            </p>
          </div>

          <KCard>
            <fieldset :aria-labelledby="`fields-group-title-${uuid}`">
              <KInput
                v-model.trim="state.fields.username"
                autocomplete="off"
                class="username-field"
                data-testid="consumer-form-username"
                :label="t('consumers.fields.username.label')"
                :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
                :placeholder="t('consumers.fields.username.placeholder')"
                :readonly="state.readonly"
                type="text"
              >
                <template #label-tooltip>
                  <i18nT
                    keypath="consumers.fields.username.tooltip"
                    scope="global"
                  >
                    <template #custom_id>
                      <code>{{ t('consumers.fields.username.custom_id') }}</code>
                    </template>
                  </i18nT>
                </template>
              </KInput>

              <KInput
                v-model.trim="state.fields.customId"
                autocomplete="off"
                data-testid="consumer-form-custom-id"
                :label="t('consumers.fields.custom_id.label')"
                :label-attributes="{ tooltipAttributes: { maxWidth: '400' } }"
                :placeholder="t('consumers.fields.custom_id.placeholder')"
                :readonly="state.readonly"
                type="text"
              >
                <template #label-tooltip>
                  <i18nT
                    keypath="consumers.fields.custom_id.tooltip"
                    scope="global"
                  >
                    <template #username>
                      <code>{{ t('consumers.fields.custom_id.username') }}</code>
                    </template>
                  </i18nT>
                </template>
              </KInput>
            </fieldset>
          </KCard>

          <KInput
            v-model.trim="state.fields.tags"
            autocomplete="off"
            data-testid="consumer-form-tags"
            :help="t('consumers.fields.tags.help')"
            :label="t('consumers.fields.tags.label')"
            :label-attributes="{
              info: t('consumers.fields.tags.tooltip'),
              tooltipAttributes: { maxWidth: '400' },
            }"
            :placeholder="t('consumers.fields.tags.placeholder')"
            :readonly="state.readonly"
            type="text"
          />
        </EntityFormSection>
      </div>
    </EntityBaseForm>
  </div>
</template>

<script lang="ts" setup>
import {
  useAxios,
  useErrors,
  EntityFormSection,
  EntityBaseForm,
  EntityBaseFormType,
  SupportedEntityType,
} from '@kong-ui-public/entities-shared'
import composables from '../composables'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { PropType } from 'vue'
import { computed, reactive } from 'vue'
import type {
  ConsumerPayload,
  ConsumerState,
  ConsumerStateFields,
  KongManagerConsumerFormConfig,
  KonnectConsumerFormConfig,
} from '../types'
import { useRouter } from 'vue-router'
import type { AxiosError, AxiosResponse } from 'axios'
import endpoints from '../consumers-endpoints'
import { v4 as uuidv4 } from 'uuid'

const props = defineProps({
  /** The base konnect or kongManger config. Pass additional config props in the shared entity component as needed. */
  config: {
    type: Object as PropType<KonnectConsumerFormConfig | KongManagerConsumerFormConfig>,
    required: true,
    validator: (config: KonnectConsumerFormConfig | KongManagerConsumerFormConfig): boolean => {
      if (!config || !['konnect', 'kongManager'].includes(config?.app)) return false
      if (config?.app === 'konnect' && !config?.controlPlaneId) return false
      if (config?.app === 'kongManager' && typeof config?.workspace !== 'string') return false
      if (!config?.cancelRoute) return false
      return true
    },
  },
  /** If a valid consumerId is provided, it will put the form in Edit mode instead of Create */
  consumerId: {
    type: String,
    required: false,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'update', data: ConsumerStateFields): void
  (e: 'error', error: AxiosError): void
  (e: 'loading', isLoading: boolean): void
}>()

const { i18nT, i18n: { t } } = composables.useI18n()
const router = useRouter()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const { getMessageFromError } = useErrors()
const uuid = uuidv4()

const state = reactive<ConsumerState>({
  fields: {
    username: '',
    customId: '',
    tags: '',
  },
  readonly: false,
  errorMessage: '',
})

const originalFields = reactive<ConsumerStateFields>({
  username: '',
  customId: '',
  tags: '',
})

const fetchUrl = computed<string>(() => endpoints.form[props.config?.app]?.edit)

const cancelHandler = (): void => {
  router.push(props.config?.cancelRoute || { name: 'consumer-list' })
}

const loadingHandler = (val: boolean): void => {
  emit('loading', val)
}

const fetchErrorHandler = (err: AxiosError): void => {
  emit('error', err)
}

const updateFormValues = (data: Record<string, any>): void => {
  state.fields.username = data?.item?.username || data?.username || ''
  state.fields.customId = data?.item?.custom_id || data?.custom_id || ''

  const tags = data?.item?.tags || data?.tags || []
  state.fields.tags = tags?.join(', ') || ''

  Object.assign(originalFields, state.fields)
}

const formType = computed((): EntityBaseFormType => props.consumerId
  ? EntityBaseFormType.Edit
  : EntityBaseFormType.Create)

const getUrl = (action: 'create' | 'edit'): string => {
  let url = `${props.config?.apiBaseUrl}${endpoints.form[props.config?.app][action]}`

  if (props.config?.app === 'konnect') {
    url = url.replace(/{controlPlaneId}/gi, props.config?.controlPlaneId || '')
  } else if (props.config?.app === 'kongManager') {
    url = url.replace(/\/{workspace}/gi, props.config?.workspace ? `/${props.config.workspace}` : '')
  }

  url = url.replace(/{id}/gi, props.consumerId)

  return url
}

const isFormValid = computed((): boolean => !!state.fields.username || !!state.fields.customId)
const changesExist = computed((): boolean => JSON.stringify(state.fields) !== JSON.stringify(originalFields))

const payload = computed((): ConsumerPayload => {
  return {
    username: state.fields.username || null,
    custom_id: state.fields.customId || null,
    tags: state.fields.tags.split(',')?.map((tag: string) => String(tag || '')
      .trim())?.filter((tag: string) => tag !== ''),
  }
})

const submitData = async (): Promise<void> => {
  try {
    state.readonly = true

    let response: AxiosResponse | undefined

    if (formType.value === 'create') {
      response = await axiosInstance.post(getUrl('create'), payload.value)
    } else if (formType.value === 'edit') {
      response = props.config?.app === 'konnect'
        ? await axiosInstance.put(getUrl('edit'), payload.value)
        : await axiosInstance.patch(getUrl('edit'), payload.value)
    }

    updateFormValues(response?.data)

    emit('update', response?.data)
  } catch (error: any) {
    state.errorMessage = getMessageFromError(error)
    emit('error', error as AxiosError)
  } finally {
    state.readonly = false
  }
}
</script>

<style lang="scss" scoped>
.kong-ui-entities-consumer-form {
  width: 100%;

  @media screen and (min-width: $kui-breakpoint-laptop) {
    &:deep(.form-section-wrapper) {
      column-gap: $kui-space-130;
    }
  }

  fieldset {
    border: none;
    margin: 0;
    padding: 0;
  }
}

.fields-group {
  &-title {
    color: $kui-color-text-neutral-strongest;
    font-size: $kui-font-size-40;
    font-weight: 600;
    line-height: 20px;
    margin-bottom: 4px;
    margin-top: 0;
  }

  &-text {
    color: rgba(0, 0, 0, 0.45);
    font-size: $kui-font-size-30;
    line-height: 20px;
    margin-bottom: 0;
    margin-top: 0;
  }
}

.username-field {
  margin-bottom: 16px;
}
</style>
