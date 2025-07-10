<template>
  <component
    :is="schema.disabled ? 'k-tooltip' : 'div'"
    class="field-wrap autosuggest"
    max-width="300"
    :text="t('general.disable_source_scope_change', { scope })"
  >
    <FieldScopedEntitySelect
      :id="idValue"
      :allow-uuid-search="allowUuidSearch"
      :disabled="loading"
      :dom-id="schema.model"
      :field-disabled="schema.disabled"
      :fields="inputFieldsWithoutId"
      :get-all="getAll"
      :get-one="getOne"
      :get-partial="getPartial"
      :initial-item="initialItem"
      :placeholder="loading ? t('fields.auto_suggest.loading') : schema.placeholder"
      :transform-item="transformItem"
      @change="onSelected"
    >
      <template
        v-if="loading"
        #before
      >
        <ProgressIcon :size="KUI_ICON_SIZE_30" />
      </template>
      <template #item="{ item }">
        <div class="entity-suggestion-item">
          <span class="entity-label">
            {{ item.label }}
          </span><span class="entity-id">
            {{ item.id }}
          </span>
        </div>
      </template>

      <template #selected-item="{ item }">
        <span>{{ item.label }} - {{ item.id }}</span>
      </template>
    </FieldScopedEntitySelect>
  </component>
</template>

<script>
import abstractField from './abstractField'
import { createI18n } from '@kong-ui-public/i18n'
import { ProgressIcon } from '@kong/icons'
import { KUI_ICON_SIZE_30 } from '@kong/design-tokens'
import FieldScopedEntitySelect from './FieldScopedEntitySelect.vue'
import { getFieldState } from '../../utils/autoSuggest'
import { FORMS_API_KEY, FIELD_STATES } from '../../const'
import english from '../../locales/en.json'

const requestResultsLimit = 50

export default {
  components: {
    FieldScopedEntitySelect,
    ProgressIcon,
  },
  mixins: [abstractField],
  inject: [FORMS_API_KEY],
  emits: ['model-updated'],

  setup() {
    const { t } = createI18n('en-us', english)
    return {
      t,
      KUI_ICON_SIZE_30,
    }
  },

  data() {
    return {
      suggestions: [],
      idValue: '',
      message: 'Type something to search',
      items: [],
      initialItem: null,
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
  },

  async created() {
    await this.$nextTick()
    let presetEntity
    let entityData

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
          entityData = (await this[FORMS_API_KEY].getOne(this.entity, this.model[this.schema.model])).data
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
      }
      // putting this here prevents the select value from being 'select' -> 'actual value' after the loading state gets flashed
      this.loading = false
    } catch (err) {
      this.message = this.t('fields.auto_suggest.error.load_entity', { entity: this.schema.entity })
      console.error('err!', err)
    }
  },

  methods: {
    getPartial(size) {
      return this[FORMS_API_KEY].peek(this.entity, size)
    },
    async getAll(query) {
      const items = []
      const promises = []
      const filteredIds = new Set()
      // Search on fields with backend filtering support
      promises.push(...this.inputFieldsWithoutId.map(async (field) => {
        const result = await this.fetchSuggestions(query, field)
        items.push(...this.dedupeSuggestions(result, filteredIds))
      }))

      await Promise.all(promises)

      return items
    },
    async getOne(id) {
      if (!this[FORMS_API_KEY]) {
        console.warn('[@kong-ui-public/forms] No API service provided')
        return {}
      }
      const res = await this[FORMS_API_KEY].getOne(this.entity, id)

      return res.data
    },

    transformItem(item) {
      return {
        ...item,
        label: this.getSuggestionLabel(item),
        value: item.id,
      }
    },

    dedupeSuggestions(items, filteredIds) {
      const dedupedItems = []
      items.forEach((item) => {
        if (!filteredIds.has(item.id)) {
          filteredIds.add(item.id)
          dedupedItems.push(item)
        }
      })

      return dedupedItems
    },

    getItem(data) {
      if (data.data) {
        return data.data.length > 0 ? data.data[0] : []
      }

      return data
    },

    async fetchUntilLimit(params) {
      const data = []
      let offset = null

      if (!this[FORMS_API_KEY]) {
        console.warn('[@kong-ui-public/forms] No API service provided')
        return []
      }

      const fetcher = this.entity === 'consumer_group' ? this[FORMS_API_KEY].getAll : this[FORMS_API_KEY].getAllV2

      while (data.length < requestResultsLimit) {
        const res = await fetcher(this.entity, {
          size: requestResultsLimit > 1000 ? 1000 : requestResultsLimit,
          offset,
          ...params,
        })

        data.push(...res.data.data)
        offset = res.data.offset
        if (!offset) break
      }

      return data.slice(0, requestResultsLimit)
    },

    async fetchSuggestions(query, field) {
      return this.fetchUntilLimit({ [field]: query })
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
      this.idValue = item && item.id
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
    font-size: 14px;
    padding: 8px 0;
    text-align: center;
  }

  .k-select-item-label span:last-child {
    opacity: 0.7;
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

  .entity-label {
    font-weight: $kui-font-weight-bold;
  }

  .entity-id {
    color: $kui-color-text-neutral;
    font-size: $kui-font-size-20;
  }
}
</style>
