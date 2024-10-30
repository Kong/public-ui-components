<template>
  <template v-if="config.isExactMatch">
    <KInput
      v-if="!config.selectItems"
      autocomplete="off"
      class="kong-ui-entity-filter-input"
      data-testid="search-input"
      :model-value="modelValue"
      :placeholder="config.placeholder"
      @update:model-value="handleQueryUpdate"
    >
      <template #before>
        <IconFilter />
      </template>
      <template #after>
        <CloseIcon
          v-show="modelValue !== ''"
          class="kong-ui-entity-filter-clear"
          role="button"
          tabindex="0"
          @click="handleQueryClear"
        />
      </template>
    </KInput>
    <KSelect
      v-else
      class="kong-ui-entity-filter-input"
      clearable
      data-testid="search-input"
      enable-filtering
      :filter-function="config.selectFilterFunction"
      :items="config.selectItems"
      :model-value="modelValue"
      :placeholder="config.placeholder"
      @update:model-value="handleQueryUpdate"
    >
      <template #before>
        <IconFilter />
      </template>
    </KSelect>
  </template>
  <template v-else>
    <div class="kong-ui-entity-filter">
      <KButton
        appearance="tertiary"
        data-testid="filter-button"
        @click="toggleMenu"
      >
        <IconFilter />
        {{ t('filter.filterButtonText') }} {{ filteredFields.length > 0 ? `(${filteredFields.length})` : '' }}
      </KButton>
      <div
        v-show="showMenu"
        class="kong-ui-entity-filter-backdrop"
        @click="toggleMenu"
      />
      <div
        v-show="showMenu"
        class="kong-ui-entity-filter-menu"
      >
        <div
          v-for="field in searchableFields"
          :key="field.value"
          class="kong-ui-entity-filter-menu-item"
          :data-testid="field.value"
        >
          <span
            class="menu-item-title"
            :class="{ expanded: expandedFields.has(field.value) }"
            role="button"
            tabindex="0"
            @click="toggleExpanded(field.value)"
            @keydown.enter="toggleExpanded(field.value)"
          >
            {{ field.label }}
            <span
              v-show="filteredFields.includes(field.value)"
              class="menu-item-indicator"
            />
            <ChevronDownIcon
              class="menu-item-expand-icon"
              :class="{ expanded: expandedFields.has(field.value) }"
              :color="KUI_COLOR_TEXT_NEUTRAL_WEAK"
            />
          </span>
          <div
            v-show="expandedFields.has(field.value)"
            class="menu-item-body"
          >
            <label
              class="menu-item-label"
              :for="getFieldId(field.value)"
            >
              {{ t('filter.fieldLabel') }}
            </label>
            <KSelect
              v-if="config.schema?.[field.value]?.type === 'select'"
              :id="getFieldId(field.value)"
              v-model="searchParams[field.value]"
              :items="getFieldOptions(field.value)"
              :placeholder="t('filter.selectPlaceholder')"
            />
            <KInput
              v-else
              :id="getFieldId(field.value)"
              v-model="searchParams[field.value]"
              autocomplete="off"
              :placeholder="t('filter.inputPlaceholder')"
              :type="getFieldInputType(field.value)"
            />
          </div>
          <div
            v-show="expandedFields.has(field.value)"
            class="menu-item-buttons"
          >
            <KButton
              appearance="tertiary"
              data-testid="apply-filter"
              size="small"
              @click="applyFields(true)"
            >
              {{ t('filter.applyButtonText') }}
            </KButton>
            <KButton
              appearance="tertiary"
              data-testid="clear-filter"
              size="small"
              @click="clearField(field.value)"
            >
              {{ t('filter.clearButtonText') }}
            </KButton>
          </div>
        </div>
        <div class="filter-clear-button-container">
          <KButton
            appearance="tertiary"
            size="small"
            @click="clearFields"
          >
            {{ t('filter.clearAllButtonText') }}
          </KButton>
        </div>
      </div>
    </div>
  </template>
</template>

<script setup lang="ts">
import type { PropType } from 'vue'
import { computed, ref, watch } from 'vue'
import { CloseIcon, ChevronDownIcon } from '@kong/icons'
import { KUI_COLOR_TEXT_NEUTRAL_WEAK } from '@kong/design-tokens'
import type { ExactMatchFilterConfig, FuzzyMatchFilterConfig } from '../../types'
import composables from '../../composables'
import IconFilter from '../icons/IconFilter.vue'

const { i18n: { t } } = composables.useI18n()

const props = defineProps({
  // filter config, either exact match or fuzzy match
  config: {
    type: Object as PropType<ExactMatchFilterConfig | FuzzyMatchFilterConfig>,
    required: true,
    default: () => ({
      isExactMatch: true,
      placeholder: '',
    }),
  },
  // query string
  modelValue: {
    type: String,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'update:modelValue', query: string) : void,
}>()

const showMenu = ref(false)
const searchParams = ref<{ [key: string]: string | number }>({})
const expandedFields = ref<Set<string>>(new Set())

const filteredFields = computed<string[]>(() => {
  const fields: string[] = []
  new URLSearchParams(props.modelValue).forEach((value, key) => {
    if (value !== '') {
      fields.push(key)
    }
  })
  return fields
})

const searchableFields = computed<{ label: string, value: string, expanded: boolean }[]>(() => {
  const fields = (props.config as FuzzyMatchFilterConfig).fields
  return Object
    .keys(fields)
    .filter((key: string) => fields?.[key]?.searchable)
    .map((key: string) => ({
      label: fields[key].label || key,
      value: key,
      expanded: false,
    })) as { label: string, value: string, expanded: boolean }[]
})

watch(() => props.modelValue, (val) => {
  searchParams.value = {}
  new URLSearchParams(val).forEach((value, key) => {
    searchParams.value[key] = value
  })
})

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const toggleExpanded = (field: string) => {
  expandedFields.value.has(field) ? expandedFields.value.delete(field) : expandedFields.value.add(field)
}

const handleQueryUpdate = (query: string | number | null) => {
  emit('update:modelValue', String(query ?? ''))
}

const handleQueryClear = () => {
  handleQueryUpdate('')
}

const getFieldId = (field: string) => {
  return `filter-${field}`
}

const getFieldOptions = (field: string) => {
  return ((props.config as FuzzyMatchFilterConfig).schema?.[field]?.values ?? []).map((o: string) => ({
    value: o,
    label: o,
  }))
}

const getFieldInputType = (field: string) => {
  return (props.config as FuzzyMatchFilterConfig).schema?.[field]?.type ?? 'text'
}

const clearField = (field: string) => {
  searchParams.value = {
    ...searchParams.value,
    [field]: '',
  }
  applyFields()
}

const clearFields = () => {
  searchParams.value = {}
  applyFields(true)
}

const applyFields = (hideMenu = false) => {
  const filteredParams = Object
    .keys(searchParams.value)
    .reduce((acc, key) => {
      if (searchParams.value[key]) {
        acc[key] = `${searchParams.value[key]}`
      }
      return acc
    }, {} as { [key: string]: string })

  if (hideMenu) {
    showMenu.value = false
  }

  emit('update:modelValue', new URLSearchParams(filteredParams).toString())
}
</script>

<style lang="scss" scoped>
.kong-ui-entity-filter-input {
  width: 100%;
}

.kong-ui-entity-filter-clear {
  cursor: pointer;
}

.kong-ui-entity-filter {
  display: flex;
  position: relative;

  :deep(.menu-content) {
    flex-direction: column;
  }

  :deep(.k-menu-item-divider hr) {
    margin: 12px 0;
  }
}

.kong-ui-entity-filter-backdrop {
  bottom: 0;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  z-index: 1050;
}

.kong-ui-entity-filter-menu {
  background-color: $kui-color-background;
  border: $kui-border-width-10 solid $kui-color-border-neutral-weak;
  border-radius: $kui-border-radius-20;
  box-shadow: 0 4px 20px $kui-color-border;
  left: 0;
  margin-top: 16px;
  padding: $kui-space-40 0 $kui-space-50;
  position: absolute;
  top: 100%;
  width: 300px;
  z-index: 1060;
}

.kong-ui-entity-filter-menu-item {
  border-bottom: $kui-border-width-10 solid $kui-color-border;
  color: $kui-color-text-neutral;
  font-size: $kui-font-size-20;
  font-weight: $kui-font-weight-regular;
  line-height: $kui-line-height-20;
  list-style: none;
  margin: $kui-space-0 $kui-space-70;
  padding: $kui-space-60 0;
  position: relative;
  white-space: nowrap;
}

.menu-item-title {
  align-items: center;
  cursor: pointer;
  display: flex;
  line-height: $kui-line-height-40;

  &.expanded {
    color: $kui-color-text-neutral-strongest;
  }
}

.menu-item-expand-icon {
  margin-left: auto;

  &.expanded {
    transform: rotate(180deg);
  }
}

.menu-item-indicator {
  background-color: $kui-color-background-primary;
  border-radius: 50%;
  height: 4px;
  margin-left: 4px;
  width: 4px;
}

.menu-item-body {
  align-items: center;
  display: flex;
  justify-content: space-between;
  margin-top: $kui-space-60;

  :deep(.input) {
    padding-bottom: 4px!important;
    padding-top: 4px!important;
  }

  :deep(.k-input) {
    width: 100%;
  }

  :deep(.k-select-input .input) {
    font-size: 12px;

    &::placeholder {
      color: rgba(0, 0, 0, .45)!important;
      font-size: 12px;
    }
  }
}

.menu-item-label {
  margin-bottom: 0;
  margin-right: 12px;
}

.menu-item-buttons {
  display: flex;
  justify-content: space-between;
  margin: 10px 0 6px;
}

.filter-clear-button-container {
  padding: $kui-space-50 $kui-space-70 0;
}
</style>
