<template>
  <div
    :id="idName"
    data-testid="export-csv"
    @click="generate"
  >
    <slot>Download {{ name }}</slot>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ValidType } from '../../types'
import type { CsvData, CsvKeyValuePair } from '../../types'
import type { PropType } from 'vue'

import mapKeys from 'lodash.mapkeys'
import pickBy from 'lodash.pickby'
import pick from 'lodash.pick'
import { saveAs } from 'file-saver'
import { unparse } from 'papaparse'

const emit = defineEmits(['export-started', 'export-finished'])

const props = defineProps({
  /**
   * Json to download
   */
  data: {
    type: Array as PropType<CsvData>,
    required: true,
  },
  /**
   * fields inside the Json Object that you want to export
   * if no given, all the properties in the Json are exported
   * Can either be an array or a function
   */
  fields: {
    type: Array<string>,
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
   * Labels for columns
   *
   * Object or function
   */
  labels: {
    type: Object as PropType<CsvKeyValuePair>,
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

console.log(' >>> fields', props.fields)
console.log(' >>> labels', props.labels)
console.log(' >>> data', props.data)

// unique identifier
const idName = computed(() => `export_${new Date().getTime()}`)

const exportableData = computed(() => {
  const filteredData = cleaningData()

  if (props.testing) {
    (window as any).__cypress_filteredData = { filteredData }
  }

  return filteredData.length ? filteredData : null
})

const labelsFunctionGenerator = (): any => {
  const labels: any = props.labels

  if (typeof props.fields as ValidType !== ValidType.Object) {
    throw new Error('Labels needs to be a object containing key / value pairs.')
  }

  if (typeof labels as ValidType === ValidType.Object) {
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
  if (typeof props.fields as ValidType !== ValidType.Object && !Array.isArray(fields)) {
    throw new Error('Fields needs to be an array of strings.')
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
  if (typeof props.fields as ValidType === ValidType.Undefined && typeof props.labels as ValidType === ValidType.Undefined) {
    return props.data
  }

  const labels = labelsFunctionGenerator()
  const fields = fieldsFunctionGenerator()

  return props.data.map(item => labels(fields(item)))
}

const generate = () => {
  emit('export-started')

  if (!exportableData?.value) {
    console.warn('No data to export')
    return
  }

  let csv = unparse(
    exportableData.value,
    Object.assign(
      {
        delimiter: props.delimiter,
        encoding: props.encoding,
      },
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
