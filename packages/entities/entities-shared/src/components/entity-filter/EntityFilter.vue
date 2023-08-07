<template>
  <template v-if="config.isExactMatch">
    <KInput
      autocomplete="off"
      class="kong-ui-entity-filter-input"
      data-testid="search-input"
      :model-value="modelValue"
      :placeholder="config.placeholder"
      @update:model-value="handleQueryUpdate"
    >
      <template #icon>
        <IconFilter />
      </template>
    </KInput>
  </template>
  <template v-else>
    <div class="kong-ui-entity-filter">
      <KButton
        appearance="btn-link"
        data-testid="filter-button"
        icon="filter"
        @click="toggleMenu"
      >
        {{ t('filter.filterButtonText') }} {{ filteredFields.length > 0 ? `(${filteredFields.length})` : '' }}
      </KButton>
      <div
        v-show="showMenu"
        class="kong-ui-entity-filter-backdrop"
        @click="toggleMenu"
      />
      <KMenu
        v-show="showMenu"
        class="kong-ui-entity-filter-menu"
      >
        <template #body>
          <KMenuItem
            v-for="(field, index) in searchableFields"
            :key="field.value"
            :data-testid="field.value"
            expandable
            :last-menu-item="index === searchableFields.length - 1"
          >
            <template #itemTitle>
              <span class="menu-item-title">
                {{ field.label }}
                <span
                  v-show="filteredFields.includes(field.value)"
                  class="menu-item-indicator"
                />
              </span>
            </template>
            <template #itemBody>
              <div class="menu-item-body">
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
                  appearance="select"
                  :items="getFieldOptions(field.value)"
                  :placeholder="t('filter.selectPlaceholder')"
                />
                <KInput
                  v-else
                  :id="getFieldId(field.value)"
                  v-model="searchParams[field.value]"
                  autocomplete="off"
                  :placeholder="t('filter.inputPlaceholder')"
                  size="small"
                  :type="getFieldInputType(field.value)"
                />
              </div>
              <div class="menu-item-buttons">
                <KButton
                  appearance="btn-link"
                  data-testid="apply-filter"
                  size="small"
                  @click="applyFields(true)"
                >
                  {{ t('filter.applyButtonText') }}
                </KButton>
                <KButton
                  appearance="btn-link"
                  data-testid="clear-filter"
                  size="small"
                  @click="clearField(field.value)"
                >
                  {{ t('filter.clearButtonText') }}
                </KButton>
              </div>
            </template>
          </KMenuItem>
        </template>
        <template #actionButton>
          <KButton @click="clearFields">
            {{ t('filter.clearAllButtonText') }}
          </KButton>
        </template>
      </KMenu>
    </div>
  </template>
</template>

<script setup lang="ts">
import { computed, PropType, ref, watch } from 'vue'
import { ExactMatchFilterConfig, FuzzyMatchFilterConfig } from '../../types'
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

const filteredFields = computed<string[]>(() => {
  const fields: string[] = []
  new URLSearchParams(props.modelValue).forEach((value, key) => {
    if (value !== '') {
      fields.push(key)
    }
  })
  return fields
})

const searchableFields = computed<{ label: string, value: string }[]>(() => {
  const fields = (props.config as FuzzyMatchFilterConfig).fields
  return Object
    .keys(fields)
    .filter((key: string) => fields[key].searchable)
    .map((key: string) => ({
      label: fields[key].label || key,
      value: key,
    })) as { label: string, value: string }[]
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

const handleQueryUpdate = (query: string) => {
  emit('update:modelValue', query)
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
  box-shadow: 0 4px 20px $kui-color-border;
  left: 0;
  margin-top: 16px;
  position: absolute;
  top: 100%;
  z-index: 1060;

  :deep(.k-menu-item .menu-button) {
    &:focus {
      box-shadow: none;
    }
    &:focus-visible {
      box-shadow: 0 0 0 1px $kui-color-border-primary-weaker;
    }
  }
}

.menu-item-title {
  align-items: center;
  display: flex;
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

  :deep(.k-input) {
    padding-bottom: 4px!important;
    padding-top: 4px!important;
  }

  :deep(.k-input-wrapper) {
    width: 100%;
  }

  :deep(.k-select-input .k-input) {
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
</style>
