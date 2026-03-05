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
      :initial-item-selected="initialValueSelected"
      :label-field="schema.labelField || 'id'"
      :placeholder="loading ? t('fields.auto_suggest.loading') : schema.placeholder"
      :selected-item="selectedItem"
      :selected-item-loading="loading"
      @change="onSelected"
    />
  </component>
</template>

<script>
import abstractField from './abstractField'
import { createI18n } from '@kong-ui-public/i18n'
import FieldScopedEntitySelect from './FieldScopedEntitySelect.vue'
import { getFieldState } from '../../utils/autoSuggest'
import { FORMS_API_KEY, FIELD_STATES } from '../../const'
import english from '../../locales/en.json'

export default {
  components: {
    FieldScopedEntitySelect,
  },
  mixins: [abstractField],
  inject: [FORMS_API_KEY],
  emits: ['model-updated'],

  setup() {
    const { t } = createI18n('en-us', english)
    return { t }
  },

  data() {
    return {
      idValue: '',
      error: null,
      initialItem: null,
      selectedItem: null,
      loading: false,
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
      this.error = err.message || this.t('fields.auto_suggest.error.load_entity', { entity: this.schema.entity })
      console.error('err!', err)
    } finally {
      this.loading = false
    }
  },

  methods: {
    async getOne(id) {
      if (!this[FORMS_API_KEY]) {
        console.warn('[@kong-ui-public/forms] No API service provided')
        return {}
      }
      const res = await this[FORMS_API_KEY].getOne(this.entity, id, {
        validateStatus: status => (status >= 200 && status < 300) || status === 404,
      })

      if (res.status === 404) {
        throw new Error(`Entity of type ${this.entity} with id ${id} not found`)
      }

      return res.data
    },

    transformItem(item) {
      const labelKey = this.schema?.labelField || 'id'
      return {
        ...item,
        label: labelKey && item ? item[labelKey] : '',
        value: item.id,
      }
    },

    getItem(data) {
      if (data.data) {
        return data.data.length > 0 ? data.data[0] : []
      }

      return data
    },

    updateModel(value) {
      this.$emit('model-updated', value?.length ? value : null, this.schema.model)
    },

    onSelected(item) {
      this.error = null
      this.idValue = item && item.id
      this.selectedItem = item
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
</style>
