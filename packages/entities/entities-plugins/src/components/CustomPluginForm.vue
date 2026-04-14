<template>
  <div class="kong-ui-entities-custom-plugin-form">
    <EntityBaseForm
      :can-submit="canSubmit"
      :config="config"
      :entity-type="SupportedEntityType.Plugin"
      :error-message="state.errorMessage"
      :form-fields="payload"
      :is-readonly="state.readonly"
      @cancel="cancelHandler"
      @submit="submitData"
    >
      <!-- Step 1: Custom plugin type -->
      <EntityFormBlock
        v-if="!editMode"
        class="custom-plugin-form-steps"
        :step="1"
        :title="t('custom_plugin_form.step1.title')"
      >
        <div class="plugin-type-radios">
          <KRadio
            v-model="state.fields.pluginType"
            card
            card-orientation="horizontal"
            data-testid="custom-plugin-type-installed"
            :description="t('custom_plugin_form.step1.types.installed.description')"
            :label="t('custom_plugin_form.step1.types.installed.label')"
            selected-value="installed"
          />
          <KRadio
            v-model="state.fields.pluginType"
            card
            card-orientation="horizontal"
            data-testid="custom-plugin-type-streamed"
            :description="t('custom_plugin_form.step1.types.streamed.description')"
            :label="t('custom_plugin_form.step1.types.streamed.label')"
            selected-value="streamed"
          />
          <KRadio
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
                  <th scope="col">
                    {{ t('custom_plugin_form.step1.compare_table.columns.installed') }}
                  </th>
                  <th scope="col">
                    {{ t('custom_plugin_form.step1.compare_table.columns.streamed') }}
                  </th>
                  <th scope="col">
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
                  <td>{{ t('custom_plugin_form.step1.compare_table.rows.main_use_case.installed') }}</td>
                  <td>{{ t('custom_plugin_form.step1.compare_table.rows.main_use_case.streamed') }}</td>
                  <td>{{ t('custom_plugin_form.step1.compare_table.rows.main_use_case.cloned') }}</td>
                </tr>
                <!-- File supplied -->
                <tr>
                  <th scope="row">
                    {{ t('custom_plugin_form.step1.compare_table.rows.file_supplied.header') }}
                  </th>
                  <td>
                    <ul class="compare-list">
                      <li>{{ t('custom_plugin_form.step1.compare_table.rows.file_supplied.installed.handler') }}</li>
                      <li>{{ t('custom_plugin_form.step1.compare_table.rows.file_supplied.installed.schema') }}</li>
                      <li>{{ t('custom_plugin_form.step1.compare_table.rows.file_supplied.installed.additional') }}</li>
                    </ul>
                  </td>
                  <td>
                    <ul class="compare-list">
                      <li>{{ t('custom_plugin_form.step1.compare_table.rows.file_supplied.streamed.handler') }}</li>
                      <li>{{ t('custom_plugin_form.step1.compare_table.rows.file_supplied.streamed.schema') }}</li>
                    </ul>
                  </td>
                  <td>
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
                  <td>{{ t('custom_plugin_form.step1.compare_table.rows.how_installed.installed') }}</td>
                  <td>{{ t('custom_plugin_form.step1.compare_table.rows.how_installed.streamed') }}</td>
                  <td>{{ t('custom_plugin_form.step1.compare_table.rows.how_installed.cloned') }}</td>
                </tr>
                <!-- Sandboxing -->
                <tr>
                  <th scope="row">
                    {{ t('custom_plugin_form.step1.compare_table.rows.sandboxing.header') }}
                  </th>
                  <td>
                    <ClearIcon
                      :color="KUI_COLOR_TEXT_NEUTRAL"
                      :size="KUI_ICON_SIZE_30"
                    />
                  </td>
                  <td>
                    {{ t('custom_plugin_form.step1.compare_table.rows.sandboxing.streamed') }}
                    <KExternalLink
                      hide-icon
                      :href="externalLinks.customPluginSandboxing"
                    >
                      {{ t('custom_plugin_form.step1.compare_table.rows.sandboxing.streamed_link') }}
                    </KExternalLink>
                  </td>
                  <td>{{ t('custom_plugin_form.step1.compare_table.rows.sandboxing.cloned') }}</td>
                </tr>
                <!-- Data plane reload -->
                <tr>
                  <th scope="row">
                    {{ t('custom_plugin_form.step1.compare_table.rows.data_plane_reload.header') }}
                  </th>
                  <td>
                    <CheckCircleIcon
                      :color="KUI_COLOR_TEXT_SUCCESS"
                      :size="KUI_ICON_SIZE_30"
                    />
                  </td>
                  <td>
                    <ClearIcon
                      :color="KUI_COLOR_TEXT_NEUTRAL"
                      :size="KUI_ICON_SIZE_30"
                    />
                  </td>
                  <td>
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
          :placeholder="t('custom_plugin_form.step2_files.schema_file.placeholder')"
          required
          @file-added="(files: FileList) => state.fields.schemaFile = files[0] ?? null"
          @file-removed="state.fields.schemaFile = null"
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
          :placeholder="t('custom_plugin_form.step2_files.schema_file.placeholder')"
          required
          @file-added="(files: FileList) => state.fields.schemaFile = files[0] ?? null"
          @file-removed="state.fields.schemaFile = null"
        />
        <KFileUpload
          :accept="['.lua']"
          :button-text="t('custom_plugin_form.step2_files.handler_file.button_text')"
          data-testid="custom-plugin-handler-upload"
          :help="t('custom_plugin_form.step2_files.handler_file.help')"
          :label="t('custom_plugin_form.step2_files.handler_file.label')"
          :placeholder="t('custom_plugin_form.step2_files.handler_file.placeholder')"
          required
          @file-added="(files: FileList) => state.fields.handlerFile = files[0] ?? null"
          @file-removed="state.fields.handlerFile = null"
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
          :help="t('custom_plugin_form.step3.priority.help')"
          :label="t('custom_plugin_form.step3.priority.label')"
          :label-attributes="{
            info: t('custom_plugin_form.step3.priority.tooltip'),
          }"
          :readonly="state.readonly"
          type="number"
        />
      </EntityFormBlock>

      <template #form-actions>
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
    </EntityBaseForm>
  </div>
</template>

<script lang="ts" setup>
import {
  EntityBaseForm,
  EntityFormBlock,
  SupportedEntityType,
} from '@kong-ui-public/entities-shared'
import { FEATURE_FLAGS } from '@kong-ui-public/entities-shared'
import { CheckCircleIcon, ClearIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL, KUI_COLOR_TEXT_SUCCESS, KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import { KExternalLink } from '@kong/kongponents'
import { PluginIcon } from '@kong-ui-public/entities-plugins-icon'
import composables from '../composables'
import externalLinks from '../external-links'
import { PLUGIN_METADATA } from '../definitions/metadata'
import '@kong-ui-public/entities-shared/dist/style.css'
import type { PropType } from 'vue'
import { computed, provide, reactive, ref, watch } from 'vue'
import type { ClonedPluginPayload, CustomPluginFormConfig, CustomPluginFormType, FormPayload, InstalledPluginPayload, StreamedPluginPayload } from '../types'
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

const props = defineProps({
  config: {
    type: Object as PropType<CustomPluginFormConfig>,
    required: true,
    validator: (config: CustomPluginFormConfig): boolean => {
      if (!config || config?.app !== 'konnect') return false
      if (!config?.controlPlaneId) return false
      if (!config?.cancelRoute) return false
      return true
    },
  },
  /** The ID of a specific plugin instance. If a valid Plugin ID is provided, it will put the form in Edit mode instead of Create */
  pluginId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits<{
  (e: 'update', data: FormPayload): void
  (e: 'error', error: Error): void
  (e: 'loading', isLoading: boolean): void // not used yet
}>()

const { i18n: { t } } = composables.useI18n()
const router = useRouter()

// Force-enable the new plugin form layout
provide(FEATURE_FLAGS.KM_1948_PLUGIN_FORM_LAYOUT, computed(() => true))

const editMode = computed(() => !!props.pluginId)

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
    pluginType: CustomPluginFormType
    schemaFile: File | null
    handlerFile: File | null
    name: string
    sourcePlugin: string
    aliasName: string
    priority: string
  }
  readonly: boolean
  errorMessage: string
}>({
  fields: {
    pluginType: 'installed',
    schemaFile: null,
    handlerFile: null,
    name: '',
    sourcePlugin: '',
    aliasName: '',
    priority: '',
  },
  readonly: false,
  errorMessage: '',
})

// Reset type-specific fields when plugin type changes
watch(() => state.fields.pluginType, () => {
  state.fields.schemaFile = null
  state.fields.handlerFile = null
  state.fields.name = ''
  state.fields.sourcePlugin = ''
  state.fields.aliasName = ''
  state.fields.priority = ''
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
  switch (state.fields.pluginType) {
    case 'installed':
      return state.fields.schemaFile !== null
    case 'streamed':
      return state.fields.schemaFile !== null &&
        state.fields.handlerFile !== null &&
        state.fields.name.trim().length > 0
    case 'cloned':
      return !!state.fields.sourcePlugin &&
        state.fields.aliasName.trim().length > 0
    default:
      return false
  }
})

const payload = computed<FormPayload>(() => {
  const base = { pluginType: state.fields.pluginType }

  switch (state.fields.pluginType) {
    case 'installed':
      return { ...base, schemaFile: state.fields.schemaFile } as InstalledPluginPayload
    case 'streamed':
      return {
        ...base,
        schemaFile: state.fields.schemaFile,
        handlerFile: state.fields.handlerFile,
        name: state.fields.name,
      } as StreamedPluginPayload
    case 'cloned':
      return {
        ...base,
        sourcePlugin: state.fields.sourcePlugin,
        aliasName: state.fields.aliasName,
        priority: state.fields.priority === '' || state.fields.priority == null
          ? undefined
          : state.fields.priority,
      } as ClonedPluginPayload
    default:
      return base as FormPayload
  }
})

const cancelHandler = (): void => {
  router.push(props.config?.cancelRoute ?? { name: 'home' })
}

const submitData = async (): Promise<void> => {
  // API integration deferred — emit payload for parent to handle
  try {
    state.readonly = true
    emit('update', payload.value)
  } catch (error: any) {
    state.errorMessage = error?.message || 'An error occurred'
    emit('error', error)
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
