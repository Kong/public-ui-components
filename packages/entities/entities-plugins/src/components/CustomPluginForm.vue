<template>
  <div class="kong-ui-entities-custom-plugin-form">
    <EntityBaseForm
      :can-submit="canSubmit"
      :config="config"
      :entity-type="SupportedEntityType.Plugin"
      :error-message="state.errorMessage"
      :form-fields="state.fields"
      :is-readonly="state.readonly"
      @cancel="cancelHandler"
      @submit="submitData"
    >
      <!-- Loading -->
      <KSkeleton
        v-if="isLoading"
        type="form"
      />

      <!-- Fetch Error -->
      <KEmptyState
        v-else-if="fetchError"
        :action-button-visible="false"
        data-testid="custom-plugin-form-fetch-error"
        icon-variant="error"
      >
        <template #default>
          <h3>{{ fetchError }}</h3>
        </template>
      </KEmptyState>

      <KEmptyState
        v-else-if="showUnsupportedTypesError"
        :action-button-visible="false"
        data-testid="custom-plugin-form-unsupported-types-error"
        icon-variant="error"
      >
        <template #default>
          <h3>{{ t('custom_plugin_form.errors.no_supported_types') }}</h3>
        </template>
      </KEmptyState>

      <!-- Form Content -->
      <template v-else>
        <!-- Step 1: Custom plugin type -->
        <EntityFormBlock
          v-if="!editMode"
          class="custom-plugin-form-steps"
          :step="1"
          :title="t('custom_plugin_form.step1.title')"
        >
          <div class="plugin-type-radios">
            <KRadio
              v-if="isPluginTypeSupported('installed')"
              v-model="state.fields.pluginType"
              card
              card-orientation="horizontal"
              data-testid="custom-plugin-type-installed"
              :description="t('custom_plugin_form.step1.types.installed.description')"
              :label="t('custom_plugin_form.step1.types.installed.label')"
              selected-value="installed"
            />
            <KRadio
              v-if="isPluginTypeSupported('streamed')"
              v-model="state.fields.pluginType"
              card
              card-orientation="horizontal"
              data-testid="custom-plugin-type-streamed"
              :description="t('custom_plugin_form.step1.types.streamed.description')"
              :label="t('custom_plugin_form.step1.types.streamed.label')"
              selected-value="streamed"
            />
            <KRadio
              v-if="isPluginTypeSupported('cloned')"
              v-model="state.fields.pluginType"
              card
              card-orientation="horizontal"
              data-testid="custom-plugin-type-cloned"
              :description="t('custom_plugin_form.step1.types.cloned.description')"
              :label="t('custom_plugin_form.step1.types.cloned.label')"
              selected-value="cloned"
            />
          </div>

          <KCollapse
            v-model="isCompareCollapsed"
            class="custom-plugin-form-compare-collapse"
            data-testid="compare-deployment-options"
            trigger-alignment="leading"
            :trigger-label="t('custom_plugin_form.step1.compare_trigger')"
          >
            <div class="compare-table-wrapper">
              <table class="compare-table">
                <thead>
                  <tr>
                    <th scope="col" />
                    <th
                      v-if="isPluginTypeSupported('installed')"
                      scope="col"
                    >
                      {{ t('custom_plugin_form.step1.compare_table.columns.installed') }}
                    </th>
                    <th
                      v-if="isPluginTypeSupported('streamed')"
                      scope="col"
                    >
                      {{ t('custom_plugin_form.step1.compare_table.columns.streamed') }}
                    </th>
                    <th
                      v-if="isPluginTypeSupported('cloned')"
                      scope="col"
                    >
                      {{ t('custom_plugin_form.step1.compare_table.columns.cloned') }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <!-- Main use case -->
                  <tr>
                    <th scope="row">
                      {{ t('custom_plugin_form.step1.compare_table.rows.main_use_case.header') }}
                    </th>
                    <td v-if="isPluginTypeSupported('installed')">
                      {{ t('custom_plugin_form.step1.compare_table.rows.main_use_case.installed') }}
                    </td>
                    <td v-if="isPluginTypeSupported('streamed')">
                      {{ t('custom_plugin_form.step1.compare_table.rows.main_use_case.streamed') }}
                    </td>
                    <td v-if="isPluginTypeSupported('cloned')">
                      {{ t('custom_plugin_form.step1.compare_table.rows.main_use_case.cloned') }}
                    </td>
                  </tr>
                  <!-- File supplied -->
                  <tr>
                    <th scope="row">
                      {{ t('custom_plugin_form.step1.compare_table.rows.file_supplied.header') }}
                    </th>
                    <td v-if="isPluginTypeSupported('installed')">
                      <ul class="compare-list">
                        <li>{{ t('custom_plugin_form.step1.compare_table.rows.file_supplied.installed.handler') }}</li>
                        <li>{{ t('custom_plugin_form.step1.compare_table.rows.file_supplied.installed.schema') }}</li>
                        <li>{{ t('custom_plugin_form.step1.compare_table.rows.file_supplied.installed.additional') }}</li>
                      </ul>
                    </td>
                    <td v-if="isPluginTypeSupported('streamed')">
                      <ul class="compare-list">
                        <li>{{ t('custom_plugin_form.step1.compare_table.rows.file_supplied.streamed.handler') }}</li>
                        <li>{{ t('custom_plugin_form.step1.compare_table.rows.file_supplied.streamed.schema') }}</li>
                      </ul>
                    </td>
                    <td v-if="isPluginTypeSupported('cloned')">
                      <ClearIcon
                        :color="KUI_COLOR_TEXT_NEUTRAL"
                        :size="KUI_ICON_SIZE_30"
                      />
                    </td>
                  </tr>
                  <!-- How it's installed -->
                  <tr>
                    <th scope="row">
                      {{ t('custom_plugin_form.step1.compare_table.rows.how_installed.header') }}
                    </th>
                    <td v-if="isPluginTypeSupported('installed')">
                      {{ t('custom_plugin_form.step1.compare_table.rows.how_installed.installed') }}
                    </td>
                    <td v-if="isPluginTypeSupported('streamed')">
                      {{ t('custom_plugin_form.step1.compare_table.rows.how_installed.streamed') }}
                    </td>
                    <td v-if="isPluginTypeSupported('cloned')">
                      {{ t('custom_plugin_form.step1.compare_table.rows.how_installed.cloned') }}
                    </td>
                  </tr>
                  <!-- Sandboxing -->
                  <tr>
                    <th scope="row">
                      {{ t('custom_plugin_form.step1.compare_table.rows.sandboxing.header') }}
                    </th>
                    <td v-if="isPluginTypeSupported('installed')">
                      <ClearIcon
                        :color="KUI_COLOR_TEXT_NEUTRAL"
                        :size="KUI_ICON_SIZE_30"
                      />
                    </td>
                    <td v-if="isPluginTypeSupported('streamed')">
                      <i18nT keypath="custom_plugin_form.step1.compare_table.rows.sandboxing.streamed">
                        <template #link>
                          <KExternalLink
                            hide-icon
                            :href="externalLinks.customPluginSandboxing"
                          >
                            {{ t('custom_plugin_form.step1.compare_table.rows.sandboxing.streamed_link') }}
                          </KExternalLink>
                        </template>
                      </i18nT>
                    </td>
                    <td v-if="isPluginTypeSupported('cloned')">
                      {{ t('custom_plugin_form.step1.compare_table.rows.sandboxing.cloned') }}
                    </td>
                  </tr>
                  <!-- Data plane reload -->
                  <tr>
                    <th scope="row">
                      {{ t('custom_plugin_form.step1.compare_table.rows.data_plane_reload.header') }}
                    </th>
                    <td v-if="isPluginTypeSupported('installed')">
                      <CheckCircleIcon
                        :color="KUI_COLOR_TEXT_SUCCESS"
                        :size="KUI_ICON_SIZE_30"
                      />
                    </td>
                    <td v-if="isPluginTypeSupported('streamed')">
                      <ClearIcon
                        :color="KUI_COLOR_TEXT_NEUTRAL"
                        :size="KUI_ICON_SIZE_30"
                      />
                    </td>
                    <td v-if="isPluginTypeSupported('cloned')">
                      <ClearIcon
                        :color="KUI_COLOR_TEXT_NEUTRAL"
                        :size="KUI_ICON_SIZE_30"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </KCollapse>
        </EntityFormBlock>

        <!-- Step 2: Installed - Custom plugin files -->
        <EntityFormBlock
          v-if="state.fields.pluginType === 'installed'"
          class="custom-plugin-form-steps"
          :step="getDisplayStep(2)"
          :title="t('custom_plugin_form.step2_files.title')"
        >
          <KFileUpload
            :accept="['.lua']"
            :button-text="t('custom_plugin_form.step2_files.schema_file.button_text')"
            data-testid="custom-plugin-schema-upload"
            :help="t('custom_plugin_form.step2_files.schema_file.help')"
            :label="t('custom_plugin_form.step2_files.schema_file.label')"
            :placeholder="editMode && state.fields.schemaContent
              ? t('custom_plugin_form.step2_files.schema_file.placeholder_edit')
              : t('custom_plugin_form.step2_files.schema_file.placeholder')"
            :required="!editMode"
            @file-added="(files: FileList) => handleFileAdded('schema', files)"
            @file-removed="handleFileRemoved('schema')"
          />
          <div class="plugin-modules-section">
            <KLabel>{{ t('custom_plugin_form.step2_files.plugin_modules.label') }}</KLabel>
            <KAlert
              appearance="warning"
              :message="t('custom_plugin_form.step2_files.plugin_modules.alert')"
            />
          </div>
        </EntityFormBlock>

        <!-- Step 2: Streamed - Custom plugin files -->
        <EntityFormBlock
          v-if="state.fields.pluginType === 'streamed'"
          class="custom-plugin-form-steps"
          :step="getDisplayStep(2)"
          :title="t('custom_plugin_form.step2_files.title')"
        >
          <KFileUpload
            :accept="['.lua']"
            :button-text="t('custom_plugin_form.step2_files.schema_file.button_text')"
            data-testid="custom-plugin-schema-upload"
            :help="t('custom_plugin_form.step2_files.schema_file.help')"
            :label="t('custom_plugin_form.step2_files.schema_file.label')"
            :placeholder="editMode && state.fields.schemaContent
              ? t('custom_plugin_form.step2_files.schema_file.placeholder_edit')
              : t('custom_plugin_form.step2_files.schema_file.placeholder')"
            :required="!editMode"
            @file-added="(files: FileList) => handleFileAdded('schema', files)"
            @file-removed="handleFileRemoved('schema')"
          />
          <KFileUpload
            :accept="['.lua']"
            :button-text="t('custom_plugin_form.step2_files.handler_file.button_text')"
            data-testid="custom-plugin-handler-upload"
            :help="t('custom_plugin_form.step2_files.handler_file.help')"
            :label="t('custom_plugin_form.step2_files.handler_file.label')"
            :placeholder="editMode && state.fields.handlerContent
              ? t('custom_plugin_form.step2_files.handler_file.placeholder_edit')
              : t('custom_plugin_form.step2_files.handler_file.placeholder')"
            :required="!editMode"
            @file-added="(files: FileList) => handleFileAdded('handler', files)"
            @file-removed="handleFileRemoved('handler')"
          />
        </EntityFormBlock>

        <!-- Step 2: Cloned - Clone plugin -->
        <EntityFormBlock
          v-if="state.fields.pluginType === 'cloned'"
          class="custom-plugin-form-steps"
          :step="getDisplayStep(2)"
          :title="t('custom_plugin_form.step2_clone.title')"
        >
          <KSelect
            v-model="state.fields.sourcePlugin"
            data-testid="custom-plugin-clone-select"
            enable-filtering
            :items="clonablePluginItems"
            :label="t('custom_plugin_form.step2_clone.select_plugin.label')"
            :placeholder="t('custom_plugin_form.step2_clone.select_plugin.placeholder')"
            required
          >
            <template #item-template="{ item }">
              <div class="plugin-select-item">
                <PluginIcon
                  :name="String(item.value)"
                  :size="20"
                />
                <span>{{ item.label }}</span>
              </div>
            </template>
            <template #selected-item-template="{ item }">
              <div class="plugin-select-item">
                <PluginIcon
                  :name="String(item.value)"
                  :size="20"
                />
                <span>{{ item.label }}</span>
              </div>
            </template>
          </KSelect>
        </EntityFormBlock>

        <!-- Step 3: Streamed - General information -->
        <EntityFormBlock
          v-if="state.fields.pluginType === 'streamed'"
          class="custom-plugin-form-steps"
          :description="t('custom_plugin_form.step3.description')"
          :step="getDisplayStep(3)"
          :title="t('custom_plugin_form.step3.title')"
        >
          <KInput
            v-model.trim="state.fields.name"
            data-testid="custom-plugin-name"
            :help="t('custom_plugin_form.step3.name.help')"
            :label="t('custom_plugin_form.step3.name.label')"
            :placeholder="t('custom_plugin_form.step3.name.placeholder')"
            :readonly="state.readonly"
            required
            type="text"
          />
        </EntityFormBlock>

        <!-- Step 3: Cloned - General information -->
        <EntityFormBlock
          v-if="state.fields.pluginType === 'cloned'"
          class="custom-plugin-form-steps"
          :description="t('custom_plugin_form.step3.description')"
          :step="getDisplayStep(3)"
          :title="t('custom_plugin_form.step3.title')"
        >
          <KInput
            v-model.trim="state.fields.aliasName"
            data-testid="custom-plugin-alias-name"
            :label="t('custom_plugin_form.step3.alias_name.label')"
            :placeholder="t('custom_plugin_form.step3.alias_name.placeholder')"
            :readonly="state.readonly"
            required
            type="text"
          />
          <KInput
            v-model.trim="state.fields.priority"
            data-testid="custom-plugin-priority"
            :label="t('custom_plugin_form.step3.priority.label')"
            :label-attributes="{
              info: t('custom_plugin_form.step3.priority.tooltip'),
            }"
            :readonly="state.readonly"
            type="number"
          >
            <template #help>
              <i18nT keypath="custom_plugin_form.step3.priority.help.text">
                <template #link>
                  <KExternalLink
                    hide-icon
                    :href="externalLinks.pluginPriority"
                  >
                    {{ t('custom_plugin_form.step3.priority.help.link') }}
                  </KExternalLink>
                </template>
              </i18nT>
            </template>
          </KInput>
        </EntityFormBlock>
      </template>

      <!-- Form Actions -->
      <template #form-actions>
        <template v-if="!(isLoading || fetchError || showUnsupportedTypesError)">
          <KButton
            appearance="primary"
            data-testid="custom-plugin-form-submit"
            :disabled="!canSubmit || state.readonly"
            type="submit"
          >
            {{ t('actions.save') }}
          </KButton>
          <KButton
            appearance="secondary"
            data-testid="custom-plugin-form-cancel"
            :disabled="state.readonly"
            @click="cancelHandler"
          >
            {{ t('actions.cancel') }}
          </KButton>
        </template>
        <span v-else />
      </template>
    </EntityBaseForm>
  </div>
</template>

<script lang="ts" setup>
import {
  EntityBaseForm,
  EntityFormBlock,
  FEATURE_FLAGS,
  SupportedEntityType,
  useAxios,
  useErrors,
} from '@kong-ui-public/entities-shared'
import { CheckCircleIcon, ClearIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL, KUI_COLOR_TEXT_SUCCESS, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { KExternalLink } from '@kong/kongponents'
import { PluginIcon } from '@kong-ui-public/entities-plugins-icon'
import composables from '../composables'
import externalLinks from '../external-links'
import { PLUGIN_METADATA } from '../definitions/metadata'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { PropType } from 'vue'
import { computed, onMounted, provide, reactive, ref, watch } from 'vue'
import type {
  ClonedPluginPayload,
  KonnectCustomPluginFormConfig,
  CustomPluginFormType,
  InstalledPluginResponse,
  StreamedPluginResponse,
  KongManagerCustomPluginFormConfig,
  ClonedPluginResponse,
} from '../types'
import type { SelectGroup, SelectItem } from '@kong/kongponents'
import { useRouter } from 'vue-router'
import { usePluginMetaData } from '../composables/usePluginMeta'

const DEFAULT_CLONABLE_PLUGINS = [
  'acl',
  'datakit',
  'http-log',
  'ip-restriction',
  'jwt',
  'opa',
  'openid-connect',
  'opentelemetry',
  'post-function',
  'pre-function',
  'rate-limiting-advanced',
]

const ALL_PLUGIN_TYPES: CustomPluginFormType[] = ['installed', 'streamed', 'cloned']

const props = defineProps({
  config: {
    type: Object as PropType<KonnectCustomPluginFormConfig | KongManagerCustomPluginFormConfig>,
    required: true,
    validator: (config: KonnectCustomPluginFormConfig | KongManagerCustomPluginFormConfig): boolean => {
      if (!config || !config.app) return false
      if (config.app === 'konnect' && !config.controlPlaneId) return false
      if (config.app === 'kongManager' && !(config as KongManagerCustomPluginFormConfig).workspace) return false
      if (!config.cancelRoute) return false
      if (!config.successRoute) return false
      return true
    },
  },
  /** The name of a specific plugin instance. If a valid Plugin Name is provided, it will put the form in Edit mode instead of Create */
  pluginName: {
    type: String,
    default: '',
  },
  unsupportedTypes: {
    type: Array as PropType<CustomPluginFormType[]>,
    default: () => [],
  },
})

const emit = defineEmits<{
  (e: 'update', data: InstalledPluginResponse | StreamedPluginResponse | ClonedPluginPayload): void
  (e: 'error', error: unknown): void
  (e: 'loading', isLoading: boolean): void
}>()

const { i18n: { t }, i18nT } = composables.useI18n()
const router = useRouter()
const { getMessageFromError } = useErrors()
const { axiosInstance } = useAxios(props.config?.axiosRequestConfig)
const {
  createInstalledPlugin,
  updateInstalledPlugin,
  createStreamedPlugin,
  updateStreamedPlugin,
  getPluginType,
  getPluginByUnknownType,
  createClonedPlugin,
  updateClonedPlugin,
} = composables.useCustomPluginApi({
  axiosInstance,
  apiBaseUrl: props.config.apiBaseUrl,
  controlPlaneId: (props.config as KonnectCustomPluginFormConfig).controlPlaneId,
  app: props.config.app,
  workspace: (props.config as KongManagerCustomPluginFormConfig).workspace,
})

// Force-enable the new plugin form layout
provide(FEATURE_FLAGS.KM_1948_PLUGIN_FORM_LAYOUT, computed(() => true))

const editMode = computed(() => !!props.pluginName)
const isLoading = ref(false)
const fetchError = ref('')
const unsupportedTypeSet = computed(() => new Set(props.unsupportedTypes))
const supportedPluginTypes = computed(() => {
  return ALL_PLUGIN_TYPES.filter((type) => !unsupportedTypeSet.value.has(type))
})
const showUnsupportedTypesError = computed(() => !editMode.value && supportedPluginTypes.value.length === 0)

const getDefaultPluginType = (): CustomPluginFormType | null => {
  return supportedPluginTypes.value[0] ?? null
}

const isPluginTypeSupported = (type: CustomPluginFormType): boolean => {
  return supportedPluginTypes.value.includes(type)
}

/**
 * Calculate the step number to display
 * In edit mode, step 1 is hidden and steps are renumbered starting from 1
 * If only one step exists, don't display the step number (return undefined)
 */
const getDisplayStep = (originalStep: number): number | undefined => {
  if (editMode.value) {
    // In edit mode, step 1 is hidden, so subtract 1 from original step
    const displayStep = originalStep - 1
    // Only show step number if there's more than one step
    // For 'installed' type there's only 1 step (originally step 2), so don't show
    const totalSteps = state.fields.pluginType === 'installed' ? 1 : 2
    return totalSteps > 1 ? displayStep : undefined
  }
  return originalStep
}

const isCompareCollapsed = ref(true)

const state = reactive<{
  fields: {
    pluginType: CustomPluginFormType | null
    schemaContent: string
    handlerContent: string
    name: string
    sourcePlugin: string
    aliasName: string
    priority: string
  }
  readonly: boolean
  errorMessage: string
}>({
  fields: {
    pluginType: getDefaultPluginType(),
    schemaContent: '',
    handlerContent: '',
    name: '',
    sourcePlugin: '',
    aliasName: '',
    priority: '',
  },
  readonly: false,
  errorMessage: '',
})

let originalPluginAlias = ''

watch(supportedPluginTypes, (types) => {
  if (editMode.value) return

  if (!state.fields.pluginType || !types.includes(state.fields.pluginType)) {
    state.fields.pluginType = types[0] ?? null
  }
}, { immediate: true })

// Reset type-specific fields when plugin type changes (only in create mode)
watch(() => state.fields.pluginType, () => {
  if (!editMode.value) {
    state.fields.schemaContent = ''
    state.fields.handlerContent = ''
    state.fields.name = ''
    state.fields.sourcePlugin = ''
    state.fields.aliasName = ''
    state.fields.priority = ''
  }
})

const { getDisplayName } = usePluginMetaData()

const clonablePluginItems = computed(() => {
  const plugins = props.config?.clonablePlugins ?? DEFAULT_CLONABLE_PLUGINS
  if (plugins.length === 0) return []

  // Group plugins by their group from PLUGIN_METADATA
  const grouped: Record<string, SelectItem[]> = {}

  plugins.forEach((plugin) => {
    const metadata = PLUGIN_METADATA[plugin]
    const group = metadata?.group

    if (group) {
      if (!grouped[group]) {
        grouped[group] = []
      }
      grouped[group].push({
        label: getDisplayName(plugin),
        value: plugin,
      })
    } else {
      console.warn(`Plugin ${plugin} is missing metadata group and will be shown without grouping.`)
    }
  })

  // Convert to SelectGroup array
  const groupedItems: Array<SelectGroup | SelectItem> = []

  // Add grouped items first
  Object.keys(grouped).sort().forEach((groupName) => {
    groupedItems.push({
      label: groupName,
      items: grouped[groupName],
    })
  })

  return groupedItems
})

const canSubmit = computed((): boolean => {
  if (showUnsupportedTypesError.value || !state.fields.pluginType) {
    return false
  }

  switch (state.fields.pluginType) {
    case 'installed':
      return state.fields.schemaContent.length > 0
    case 'streamed':
      return state.fields.schemaContent.length > 0 &&
        state.fields.handlerContent.length > 0 &&
        state.fields.name.trim().length > 0
    case 'cloned':
      return !!state.fields.sourcePlugin &&
        state.fields.aliasName.trim().length > 0
    default:
      return false
  }
})

// File reading helpers

const MAX_FILE_SIZE = 1 * 1024 * 1024 // 1 MB

const readFileContent = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const result = e.target?.result
      if (typeof result === 'string') {
        resolve(result)
      } else {
        reject(new Error('Failed to read file as text'))
      }
    }
    reader.onerror = reject
    reader.readAsText(file)
  })
}

const handleFileAdded = async (type: 'schema' | 'handler', files: FileList): Promise<void> => {
  const file = files[0]
  if (!file) return

  if (file.size > MAX_FILE_SIZE) {
    state.errorMessage = t('custom_plugin_form.errors.file_too_large')
    return
  }

  try {
    const content = await readFileContent(file)
    if (type === 'schema') {
      state.fields.schemaContent = content
    } else {
      state.fields.handlerContent = content
    }
  } catch {
    state.errorMessage = t('custom_plugin_form.errors.file_read_error')
    if (type === 'schema') {
      state.fields.schemaContent = ''
    } else {
      state.fields.handlerContent = ''
    }
  }
}

const handleFileRemoved = (type: 'schema' | 'handler'): void => {
  if (type === 'schema') {
    state.fields.schemaContent = ''
  } else {
    state.fields.handlerContent = ''
  }
}

const cancelHandler = (): void => {
  router.push(props.config.cancelRoute)
}

// Fetch existing data in edit mode.
// Uses manual fetch instead of EntityBaseForm's built-in fetch because installed and
// streamed plugins have different API endpoints and response shapes that require
// custom mapping to form state.
onMounted(async () => {
  if (!props.pluginName) return

  isLoading.value = true
  emit('loading', true)

  try {
    const data = await getPluginByUnknownType(props.pluginName)
    if (!data) {
      fetchError.value = t('custom_plugin_form.errors.plugin_not_found')
      emit('error', new Error(fetchError.value))
      return
    }
    const type = getPluginType(data)

    state.fields.pluginType = type

    if (type === 'installed') {
      state.fields.schemaContent = (data as InstalledPluginResponse).item.lua_schema
    } else if (type === 'streamed') {
      const { name, schema, handler } = (data as StreamedPluginResponse)
      state.fields.name = name
      state.fields.schemaContent = schema
      state.fields.handlerContent = handler
    } else if (type === 'cloned') {
      const { link, name, priority } = data as ClonedPluginResponse
      state.fields.aliasName = name
      state.fields.sourcePlugin = link
      state.fields.priority = priority !== null ? String(priority) : ''
      originalPluginAlias = name
    } else {
      fetchError.value = t('custom_plugin_form.errors.unsupported_plugin_type', { type })
      emit('error', new Error(fetchError.value))
    }
  } catch (err: unknown) {
    fetchError.value = getMessageFromError(err)
    emit('error', err)
  } finally {
    isLoading.value = false
    emit('loading', false)
  }
})

const submitData = async (): Promise<void> => {
  state.errorMessage = ''
  state.readonly = true

  try {
    const type = state.fields.pluginType

    if (!type) {
      return
    }

    if (type === 'installed') {
      const body = { lua_schema: state.fields.schemaContent }
      const data = editMode.value
        ? await updateInstalledPlugin(props.pluginName, body)
        : await createInstalledPlugin(body)
      emit('update', data)
    } else if (type === 'streamed') {
      const body = {
        name: state.fields.name,
        schema: state.fields.schemaContent,
        handler: state.fields.handlerContent,
      }
      const data = editMode.value
        ? await updateStreamedPlugin(props.pluginName, body)
        : await createStreamedPlugin(body)
      emit('update', data)
    } else {
      const data = editMode.value
        ? await updateClonedPlugin(originalPluginAlias, {
          aliasName: state.fields.aliasName,
          sourcePlugin: state.fields.sourcePlugin,
          priority: state.fields.priority ? parseInt(state.fields.priority, 10) : undefined,
        })
        : await createClonedPlugin({
          aliasName: state.fields.aliasName,
          sourcePlugin: state.fields.sourcePlugin,
          priority: state.fields.priority ? parseInt(state.fields.priority, 10) : undefined,
        })
      emit('update', {
        pluginType: 'cloned',
        sourcePlugin: data.link,
        aliasName: data.name,
        priority: data.priority ?? undefined,
      })
    }

    router.push(props.config.successRoute)
  } catch (err: unknown) {
    state.errorMessage = getMessageFromError(err)
    emit('error', err)
  } finally {
    state.readonly = false
  }
}
</script>

<style lang="scss" scoped>
.kong-ui-entities-custom-plugin-form {
  width: 100%;
}

.plugin-type-radios {
  display: flex;
  gap: var(--kui-space-70, $kui-space-70);

  :deep(.k-radio.radio-card) {
    align-items: stretch;

    &.card-horizontal {
      .radio-card-wrapper {
        align-items: center;
        height: unset;
      }

      .radio-input {
        margin-top: 0;
        top: 50%;
        transform: translateY(-50%);
      }
    }
  }
}

// Center the collapse trigger and ensure it sits above radio card labels
:deep(.k-collapse) {
  position: relative;
  z-index: 1;

  .collapse-trigger {
    display: flex;
    justify-content: center;
  }
}

.compare-table-wrapper {
  background: var(--kui-color-background, $kui-color-background);
  border: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
  border-radius: var(--kui-border-radius-30, $kui-border-radius-30);
  overflow: auto;
  padding: var(--kui-space-70, $kui-space-70);
}

.compare-table {
  border-collapse: collapse;
  width: 100%;

  .compare-list {
    margin: 0;
    padding-left: var(--kui-space-60, $kui-space-60);
  }

  th,
  td {
    border-bottom: var(--kui-border-width-10, $kui-border-width-10) solid var(--kui-color-border, $kui-color-border);
    font-size: var(--kui-font-size-30, $kui-font-size-30);
    line-height: var(--kui-line-height-30, $kui-line-height-30);
    padding: var(--kui-space-50, $kui-space-50) var(--kui-space-60, $kui-space-60);
    text-align: left;
    vertical-align: middle;
  }

  thead th {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
  }

  tbody th {
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
    white-space: nowrap;
    width: 140px;
  }

  tbody td {
    color: var(--kui-color-text, $kui-color-text);
  }

  tbody tr:last-child th,
  tbody tr:last-child td {
    border-bottom: none;
  }
}

.plugin-modules-section {
  display: flex;
  flex-direction: column;
  gap: var(--kui-space-40, $kui-space-40);
}

.custom-plugin-form-steps {
  &:not(:first-child) {
    margin-top: var(--kui-space-80, $kui-space-80);
  }

  :deep(.header) {
    align-items: center !important;
  }
}

.custom-plugin-form-compare-collapse {
  :deep(.collapse-heading) {
    margin: 0;
  }
}

.plugin-select-item {
  align-items: center;
  display: flex;
  gap: var(--kui-space-40, $kui-space-40);
}
</style>
