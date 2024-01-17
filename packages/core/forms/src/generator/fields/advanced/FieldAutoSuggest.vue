<template>
  <div class="field-wrap autosuggest">
    <KSelect
      :id="schema.model"
      ref="suggestion"
      v-model="idValue"
      clearable
      enable-filtering
      :filter-function="() => true"
      :items="items"
      :loading="loading"
      :placeholder="schema.placeholder"
      width="100%"
      @change="onSelected"
      @query-change="onQueryChange"
    >
      <template #item-template="{item}">
        <span
          class="first-part"
          :data-testid="item.id && `${item.id}-0`"
          :data-testlabel="item.label"
        >
          {{ getSuggestionLabel(item).split(' - ')[0] }}
        </span>
        <span
          v-for="(field, idx) in getSuggestionLabel(item).split(' - ').slice(1)"
          :key="idx"
          class="field-span"
          :data-testid="(item.id && `${item.id}-${idx + 1}`) || idx + 1"
        >
          {{ field }}
        </span>
      </template>
      <template #empty>
        <div class="autosuggest__results_message">
          <span>{{ message }}</span>
        </div>
      </template>
    </KSelect>
  </div>
</template>

<script>
import { FORMS_API_KEY } from '../../../const'
import abstractField from '../abstractField'
import { debounce } from 'lodash'
import { isValidUuid } from '../../utils/isValidUuid'

const requestResultsLimit = 50
const fieldStates = {
  CREATE_NOT_FROM_ENTITY: 'CREATE_NOT_FROM_ENTITY',
  CREATE_FROM_ENTITY: 'CREATE_FROM_ENTITY',
  UPDATE_ENTITY: 'UPDATE_ENTITY',
  SET_REFERRAL_VALUE: 'SET_REFERRAL_VALUE',
}

/**
 * 1. Look up current state using current model and entity from router (if exists)
 * 2. If Updating, look up object from ID
 * 3. If Creating & from referral (ie. service -> route) set value with entity object from params
 *
 * @returns {Object} Object to set current search text
 */
function getFieldState(model, associatedEntity, bypassSearch) {
  if (bypassSearch) {
    return fieldStates.SET_REFERRAL_VALUE
  } else if ((model && !associatedEntity) || (!model && associatedEntity)) {
    return fieldStates.UPDATE_ENTITY
  } else if (model && associatedEntity) {
    return fieldStates.CREATE_FROM_ENTITY
  }

  return fieldStates.CREATE_NOT_FROM_ENTITY
}

export default {
  mixins: [abstractField],
  inject: [FORMS_API_KEY],
  emits: ['model-updated'],

  data() {
    return {
      suggestions: [],
      idValue: '',
      message: 'Type something to search',
      items: [],
      initialItems: [],
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
  },

  watch: {
    idValue: {
      handler(newVal, oldVal) {
        if (newVal !== oldVal) {
          this.updateModel(newVal)
        }
      },
    },
  },

  async created() {
    await this.$nextTick()
    let presetEntity
    let entityData

    switch (this.fieldState) {
      case fieldStates.UPDATE_ENTITY:
        if (!this[FORMS_API_KEY]) {
          console.warn('[@kong-ui-public/forms] No API service provided')
          break
        }

        // Get entity data from API. In most cases the data is stored in the `data` key of the response directly
        // but sometimes it is stored in a nested key inside the `data` key, so we allow the user to specify it in the schema
        // e.g. entity data returned from `consumer_groups/:id` is stored in `data.consumer_group`
        entityData = (await this[FORMS_API_KEY].getOne(this.entity, this.model[this.schema.model])).data
        presetEntity = this.getItem(this.schema.entityDataKey ? entityData[this.schema.entityDataKey] : entityData)
        this.idValue = presetEntity.id
        break
      case fieldStates.CREATE_FROM_ENTITY:
        this.idValue = this.associatedEntity.id
        break
      case fieldStates.SET_REFERRAL_VALUE:
        this.idValue = this.value
    }

    try {
      if (presetEntity) {
        this.initialItems = [{ ...presetEntity, label: this.getSuggestionLabel(presetEntity), value: presetEntity.id }]
      }

      this.items = this.initialItems
    } catch (err) {
      this.message = `There was an error loading ${this.schema.entity}`
      console.error('err!', err)
    }
  },

  methods: {
    onQueryChange(query) {
      if (query.trim().length === 0) {
        this.items = []
        this.message = 'Type something to search'
      }

      if (typeof this.performSearch !== 'function') {
        this.performSearch = debounce(
          this.search,
          500,
        )
      }

      this.performSearch(query)
    },

    async search(query) {
      if (query.trim().length === 0) {
        return
      }

      this.loading = true
      const items = []
      const promises = []
      const fields = this.getInputFields()
      const filteredIds = new Set()

      // If query is a valid UUID, do the exact search
      if (isValidUuid(query) && fields.includes('id')) {
        promises.push((async () => {
          const item = await this.fetchExact(query)

          items.push({ ...item, label: this.getSuggestionLabel(item), value: item.id })
        })())
      } else {
        // Search on fields with backend filtering support
        promises.push(...fields.filter((field) => field !== 'id').map(async (field) => {
          const result = await this.fetchSuggestions(query, field)
          result.forEach((item) => {
            if (!filteredIds.has(item.id)) {
              filteredIds.add(item.id)
              items.push({ ...item, label: this.getSuggestionLabel(item), value: item.id })
            }
          })
        }))
      }

      await Promise.all(promises)

      this.items = items
      if (this.items.length === 0) {
        this.message = 'No results'
      }

      this.loading = false
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
      while (data.length < requestResultsLimit) {
        const res = await this[FORMS_API_KEY].getAll(this.entity, {
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

    async fetchExact(id) {
      if (!this[FORMS_API_KEY]) {
        console.warn('[@kong-ui-public/forms] No API service provided')
        return {}
      }
      const res = await this[FORMS_API_KEY].getOne(this.entity, id)

      return res.data
    },

    getInputFields() {
      return this.schema?.inputValues?.fields || []
    },

    getSuggestionLabel(item) {
      const fields = this.getInputFields()

      return fields.length && item ? fields.map(field => item[field]).filter(Boolean).join(' - ') : ''
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
.autosuggest  {
  width: 100%;
}
.k-select {
  border: none!important;
  padding: 0!important;

  .autosuggest__results_message {
    color: rgba(0, 0, 0, 0.7);
    font-size: 14px;
    padding: 8px 0;
    text-align: center;
  }

  .k-select-item-label span:last-child {
    opacity: 0.7;
  }
}

.field-span {
  display: flex;
  justify-content: space-between;
}
</style>

<style lang="scss">
.autosuggest .k-select {
  .k-select-list .k-select-item {
    button:active {
      box-shadow: none;

      &:not(.selected) {
        background-color: $kui-color-background-neutral-weakest;
      }
    }
  }
}
</style>
