<template>
  <div
    :id="idName"
    @click="generate"
  >
    <slot>Download {{ name }}</slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import mapKeys from 'lodash.mapkeys'
import pickBy from 'lodash.pickby'
import pick from 'lodash.pick'

import { saveAs } from 'file-saver'
import { unparse } from 'papaparse'

const emit = defineEmits(['export-started', 'export-finished'])

enum ValidType {
  String = 'string',
  Number = 'number',
  Boolean = 'boolean',
  Object = 'object',
  Function = 'function',
  Undefined = 'undefined',
  Symbol = 'symbol'
}

const isType = (value: any, type: ValidType) => {
  return typeof value === type
}

const props = defineProps({
  /**
   * Json to download
   */
  data: {
    type: Array,
    required: true,
  },
  /**
   * fields inside the Json Object that you want to export
   * if no given, all the properties in the Json are exported
   * Can either be an array or a function
   */
  fields: {
    type: [Array, Function],
    required: true,
  },
  /**
   * filename to export, default: data.csv
   */
  name: {
    type: String,
    default: 'data.csv',
  },
  /**
   * Delimiter for the CSV file
   */
  delimiter: {
    type: String,
    default: ',',
    required: false,
  },
  /**
   * Should the module add SEP={delimiter}
   *
   * Useful for opening file with Excel
   */
  separatorExcel: {
    type: Boolean,
    default: false,
  },
  /**
   * What will be the encoding of the file
   */
  encoding: {
    type: String,
    default: 'utf-8',
  },
  /**
   * Advanced options for Papaparse that is used to export to CSV
   */
  advancedOptions: {
    type: Object,
    default: () => {
    },
  },
  /**
   * Labels for columns
   *
   * Object or function
   */
  labels: {
    type: [Object, Function],
    required: true,
  },
  /**
   * Used only for testing purposes
   */
  testing: {
    type: Boolean,
    required: false,
    default: false,
  },
})

// unique identifier
const idName = computed(() => `export_${new Date().getTime()}`)

const exportableData = computed(() => {
  const filteredData = cleaningData()

  return filteredData.length ? filteredData : null
})

const labelsFunctionGenerator = (): any => {
  const labels: any = props.labels
  if (
    !isType(labels, ValidType.Undefined) &&
      !isType(labels, ValidType.Function) &&
      !isType(labels, ValidType.Object)
  ) {
    throw new Error('Labels needs to be a function(value,key) or object.')
  }

  if (isType(labels, ValidType.Function)) {
    return (item: any) => {
      const _mapKeys = mapKeys(item, labels)
      return _mapKeys
    }
  }

  if (isType(labels, ValidType.Object)) {
    // @ts-ignore
    return item => {
      return mapKeys(item, (item, key) => {
        return labels[key] || key
      })
    }
  }

  // @ts-ignore
  return item => item
}

const fieldsFunctionGenerator = () => {
  const fields: any = props.fields
  if (
    !isType(fields, ValidType.Undefined) &&
      !isType(fields, ValidType.Function) &&
      !isType(fields, ValidType.Object) &&
      !Array.isArray(fields)
  ) {
    throw new Error('Fields needs to be a function(value,key) or array.')
  }

  if (
    isType(fields, ValidType.Function) ||
      (isType(fields, ValidType.Object) && !Array.isArray(fields))
  ) {

    // @ts-ignore
    return item => {
      return pickBy(item, fields)
    }
  }

  if (Array.isArray(fields)) {
    // @ts-ignore
    return item => {
      return pick(item, fields)
    }
  }

  // @ts-ignore
  return item => item
}

const cleaningData = () => {
  if (isType(props.fields, ValidType.Undefined) && isType(props.labels, ValidType.Undefined)) {
    return props.data
  }

  const labels = labelsFunctionGenerator()
  const fields = fieldsFunctionGenerator()

  return props.data.map(item => labels(fields(item)))
}

const generate = () => {
  emit('export-started')

  if (!exportableData?.value) {
    console.error('No data to export')
    return
  }

  let csv = unparse(
    exportableData.value,
    Object.assign(
      {
        delimiter: props.delimiter,
        encoding: props.encoding,
      },
      props.advancedOptions,
    ),
  )
  if (props.separatorExcel) {
    csv = 'SEP=' + props.delimiter + '\r\n' + csv
  }
  // Add BOM when UTF-8
  if (props.encoding === 'utf-8') {
    csv = '\ufeff' + csv
  }
  emit('export-finished')

  if (!props.testing) {
    const blob = new Blob([csv], {
      type: 'text/csv;charset=' + props.encoding,
    })
    saveAs(blob, props.name)
  }
}
</script>

<style scoped>
div {
  display: inline;
}
</style>
