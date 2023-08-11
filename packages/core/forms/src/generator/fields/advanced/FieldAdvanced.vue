<template>
  <div
    class="advanced-field-dropdown-wrapper"
    data-testid="advanced-field-dropdown-wrapper"
  >
    <button
      class="advanced-field-title"
      type="button"
      @click="handleOpen"
    >
      <i class="material-icons">{{ isOpen ? 'keyboard_arrow_up' : 'keyboard_arrow_right' }}</i>
      <span>{{ titleText }}</span>
    </button>
    <div
      class="advanced-field-dropdown"
      :class="openClass"
    >
      <vue-form-generator
        :model="model"
        :options="{ helpAsHtml: true }"
        :schema="schema"
        @model-updated="updateModel"
      />
    </div>
  </div>
</template>

<script>
import abstractField from '../abstractField'

export default {
  mixins: [abstractField],

  emits: ['model-updated'],

  data() {
    return {
      isOpen: false,
    }
  },

  computed: {
    openClass() {
      return this.isOpen ? 'open' : 'closed'
    },
    fieldCount() {
      return this.schema.fields.length
    },
    titleText() {
      return `${this.isOpen ? 'Hide' : 'View'} ${this.fieldCount} Advanced Fields`
    },
  },

  methods: {
    handleOpen() {
      this.isOpen = !this.isOpen
    },
    updateModel(model, schema) {
      this.$emit('model-updated', model, schema)
    },
  },
}
</script>

<style lang="scss" scoped>
.field-advanced {
  margin-bottom: 32px !important;
  margin-top: -16px;
}
.advanced-field-dropdown-wrapper {
  display: flex;
  flex-direction: column;
  width: 100%;
  .advanced-field-title {
    align-items: center;
    color: #0077cc;
    cursor: pointer;
    display: flex;
    font-size: inherit;
    margin-top: 16px;
    order: 2;
    padding: 0;
    i {
      color: #0077cc;
      font-size: 16px;
    }
    &:hover span {
      color: #0077cc;
      text-decoration: underline;
    }
  }
  .advanced-field-dropdown {
    display: block;
    height: auto;
    max-height: 100%;
    position: relative;
    width: 100%;
    /* transition: max-height 300ms cubic-bezier(.785, .135, .15, .86); */
    &.closed {
      max-height: 0;
      overflow: hidden;
    }
  }

  .advanced-field-title,
  .advanced-field-title:focus,
  .advanced-field-title:hover {
    background-color: transparent !important;
    border: none !important;
    cursor: pointer !important;
    font-weight: 400 !important;
  }
}
</style>
