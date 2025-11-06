<template>
  <component
    :is="schema.disabled ? 'k-tooltip' : 'div'"
    class="field-wrap autosuggest"
    max-width="300"
    :text="schema.disabledTooltip"
  >
    <FieldScopedEntitySelect
      :id="idValue"
      :allow-uuid-search="allowUuidSearch"
      :disabled="loading"
      :dom-id="schema.model"
      :entity="entity"
      :error="error"
      :field-disabled="schema.disabled"
      :fields="inputFieldsWithoutId"
      :get-all="getAll"
      :get-one="getOne"
      :get-partial="getPartial"
      :initial-item-selected="initialValueSelected"
      :placeholder="loading ? t('fields.auto_suggest.loading') : schema.placeholder"
      :selected-item="selectedItem"
      :selected-item-loading="loading"
      :transform-item="transformItem"
      @change="onSelected"
    >
      <template #before>
        <SearchIcon
          :color="KUI_COLOR_TEXT_NEUTRAL"
          :size="KUI_ICON_SIZE_40"
        />
      </template>
      <template #item="{ item }">
        <div class="entity-suggestion-item">
          <span class="entity-label">
            {{ item.label ?? EMPTY_VALUE_PLACEHOLDER }}
          </span>
          <span class="entity-id">
            {{ item.id }}
          </span>
        </div>
      </template>

      <template #selected-item="{ item }">
        <span class="selected-entity-item">
          <span class="selected-entity-label">{{ item.label ?? item.id }}</span>
        </span>
      </template>
    </FieldScopedEntitySelect>
  </component>
</template>

<script>
import abstractField from './abstractField'
import { createI18n } from '@kong-ui-public/i18n'
import { SearchIcon } from '@kong/icons'
import { KUI_ICON_SIZE_40, KUI_COLOR_TEXT_NEUTRAL } from '@kong/design-tokens'
import FieldScopedEntitySelect from './FieldScopedEntitySelect.vue'
import { getFieldState } from '../../utils/autoSuggest'
import { FORMS_API_KEY, FIELD_STATES, EMPTY_VALUE_PLACEHOLDER } from '../../const'
import english from '../../locales/en.json'

const requestResultsLimit = 1000

export default {
  components: {
    FieldScopedEntitySelect,
    SearchIcon,
  },
  mixins: [abstractField],
  inject: [FORMS_API_KEY],
  emits: ['model-updated'],

  setup() {
    const { t } = createI18n('en-us', english)
    return {
      t,
      KUI_ICON_SIZE_40,
      KUI_COLOR_TEXT_NEUTRAL,
      EMPTY_VALUE_PLACEHOLDER,
    }
  },

  data() {
    return {
      suggestions: [],
      idValue: '',
      message: 'Type something to search',
      error: null,
      items: [],
      initialItem: null,
      selectedItem: null,
      loading: false,
      dataDrained: false,
    }
  },

  computed: {
    fieldState() {
      return getFieldState(this.model[this.schema.model], this.associatedEntity || this.entityId, this.bypassSearch)
    },
    associatedEntity() {
      return this.$route && this.$route.params[this.entity]
    },
    entity() {
      return this.schema.entity
    },
    scope() {
      return this.schema.label.toLowerCase()
    },
    bypassSearch() {
      return this.$route && this.$route.query && this.$route.query.no_search
    },
    inputFields() {
      return this.schema?.inputValues?.fields || []
    },
    allowUuidSearch() {
      return this.inputFields.includes('id')
    },
    inputFieldsWithoutId() {
      return this.inputFields.filter(field => field !== 'id')
    },
    initialValueSelected() {
      return this.idValue === this.initialItem?.id
    },
  },

  async created() {
    await this.$nextTick()
    let presetEntity
    let entityData

    this.error = null

    try {
      switch (this.fieldState) {
        case FIELD_STATES.UPDATE_ENTITY:
          if (!this[FORMS_API_KEY]) {
            console.warn('[@kong-ui-public/forms] No API service provided')
            break
          }
          // Get entity data from API. In most cases the data is stored in the `data` key of the response directly
          // but sometimes it is stored in a nested key inside the `data` key, so we allow the user to specify it in the schema
          // e.g. entity data returned from `consumer_groups/:id` is stored in `data.consumer_group`
          this.loading = true
          entityData = await this.getOne(this.model[this.schema.model])
          presetEntity = this.getItem(this.schema.entityDataKey ? entityData[this.schema.entityDataKey] : entityData)
          this.idValue = presetEntity.id
          break
        case FIELD_STATES.CREATE_FROM_ENTITY:
          this.idValue = this.associatedEntity.id
          break
        case FIELD_STATES.SET_REFERRAL_VALUE:
          this.idValue = this.value
      }

      if (presetEntity) {
        this.initialItem = this.transformItem(presetEntity)
        this.selectedItem = this.initialItem
      }
    } catch (err) {
      this.message = this.t('fields.auto_suggest.error.load_entity', { entity: this.schema.entity })
      this.error = err.message || this.message
      console.error('err!', err)
    } finally {
      // putting this here prevents the select value from being 'select' -> 'actual value' after the loading state gets flashed
      this.loading = false
    }
  },

  methods: {
    getPartial(size) {
      return this[FORMS_API_KEY].peek(this.entity, size)
    },
    async getAll(query, signal) {
      const result = await this.fetchSuggestions(query, 'name', signal)

      return result
    },
    async getOne(id) {
      if (!this[FORMS_API_KEY]) {
        console.warn('[@kong-ui-public/forms] No API service provided')
        return {}
      }
      const res = await this[FORMS_API_KEY].getOne(this.entity, id, {
        // Avoid full screen 404 error
        validateStatus: status => (status >= 200 && status < 300) || status === 404,
      })

      if (res.status === 404) {
        throw new Error(`Entity of type ${this.entity} with id ${id} not found`)
      }

      return res.data
    },

    transformItem(item) {
      return {
        ...item,
        // This field is for select dropdown item first column.
        label: this.getSuggestionLabel(item),
        value: item.id,
      }
    },

    getItem(data) {
      if (data.data) {
        return data.data.length > 0 ? data.data[0] : []
      }

      return data
    },

    async fetchUntilLimit(params, signal) {
      if (!this[FORMS_API_KEY]) {
        console.warn('[@kong-ui-public/forms] No API service provided')
        return []
      }

      const fetcher = this[FORMS_API_KEY].getAllV2

      const { data } = await fetcher(this.entity, {
        size: requestResultsLimit,
        ...params,
      }, signal)

      return data.data
    },

    async fetchSuggestions(query, field, signal) {
      return this.fetchUntilLimit({ [field]: query }, signal)
    },

    getSuggestionLabel(item) {
      const labelKey = this.schema?.labelField || 'id'
      return labelKey && item ? item[labelKey] : ''
    },

    updateModel(value) {
      // Emit value of field to EntityForm. If empty string send as null
      this.$emit('model-updated', value?.length ? value : null, this.schema.model)
    },

    onSelected(item) {
      this.error = null
      this.idValue = item && item.id
      this.selectedItem = item // This is used for matching value not in the list
      this.updateModel(this.getReturnValue(item || {}))
    },

    getReturnValue(item) {
      const returnKey = this.schema?.returnKey

      return returnKey ? item[returnKey] : item.id
    },
  },
}
</script>

<style lang="scss" scoped>
.autosuggest {
  width: 100%;
}

.k-select {
  border: none !important;
  padding: 0 !important;

  .autosuggest__results_message {
    color: rgba(0, 0, 0, 0.7);
    font-size: $kui-font-size-30;;
    padding: $kui-space-40 0;
    text-align: center;
  }

  .k-select-item-label span:last-child {
    opacity: 0.7;
  }

  :deep(.select-item > .select-item-container > button:hover > span) {
    background-color: $kui-color-background-neutral-weaker;
  }

  :deep(.dropdown-footer) {
    margin-bottom: -$kui-space-20;
  }
}

.field-span {
  color: $kui-color-text-neutral;
  display: flex;
  justify-content: space-between;
}

.entity-suggestion-item {
  display: flex;
  flex-direction: column;
  font-family: 'Inter', sans-serif;

  .entity-label {
    color: $kui-color-text-neutral-stronger;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-medium;
  }

  .entity-id {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-medium;
  }
}

.selected-entity-item {
  font-family: 'Iter', sans-serif;
  padding-left: 28px;

  .selected-entity-label {
    font-size: $kui-font-size-30;
    font-weight: $kui-font-weight-regular;
  }
}
</style>
