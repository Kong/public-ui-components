<template>
  <div v-attributes="attributes">
    <div v-if="schema.schema">
      <vue-form-generator
        :model="value"
        :options="formOptions"
        :schema="schema.schema"
      />
    </div>
    <div v-else>
      <table
        :id="getFieldID(schema)"
        :class="schema.fieldClasses"
      >
        <tr
          v-for="(item, index) in value"
          :key="index"
        >
          <td>
            {{ index }}
          </td>
          <td v-if="keyTypes[index] === 'string'">
            <input
              v-model="value[index]"
              type="text"
            >
          </td>
          <td v-if="keyTypes[index] === 'boolean'">
            <input
              v-model="value[index]"
              type="checkbox"
            >
          </td>
          <td v-if="keyTypes[index] === 'number'">
            <input
              v-model="value[index]"
              type="number"
            >
          </td>
          <td>
            <input
              type="button"
              value="x"
              @click="removeElement(index)"
            >
          </td>
        </tr>
      </table>
      <select v-model="newKeyType">
        <option value="string">
          String
        </option>
        <option value="number">
          Number
        </option>
        <option value="boolean">
          Boolean
        </option>
      </select>
      <input
        v-model="newKeyName"
        type="text"
      >
      <input
        type="button"
        value="Add key"
        @click="addKey"
      >
    </div>
  </div>
</template>

<script>
import abstractField from '../abstractField'

export default {
  mixins: [abstractField],

  data() {
    return {
      attributes: this.schema ? this.schema.attributes : undefined,
      newKeyType: 'string',
      newKeyName: '',
      keyTypes: {},
    }
  },

  created() {
    if (!this.value) this.value = {}
  },

  mounted() {
    if (!this.value) return
    const valueKeys = Object.keys(this.value)
    const keyTypes = {}

    for (let i = 0; i < valueKeys.length; i++) {
      const key = valueKeys[i]

      keyTypes[key] = typeof this.value[key]
    }

    this.keyTypes = keyTypes
  },

  methods: {
    removeElement(index) {
      const value = this.value

      delete value[index]
      this.value = JSON.parse(JSON.stringify(value))
      const keyTypes = this.keyTypes

      delete keyTypes[index]
      this.keyTypes = JSON.parse(JSON.stringify(keyTypes))
    },

    addKey() {
      this.value[this.newKeyName] = undefined
      this.value = { ...this.value }
      this.keyTypes[this.newKeyName] = this.newKeyType
      this.keyTypes = { ...this.keyTypes }
      this.newKeyName = ''
    },
  },
}
</script>
