<template>
  <div
    :id="idName"
    data-testid="export-csv"
    @click="generate"
  >
    <slot>Download {{ filename }}</slot>
  </div>
</template>

<script setup lang="ts">
import { computed, type ComputedRef, type PropType } from 'vue'
import mapKeys from 'lodash.mapkeys'
import pick from 'lodash.pick'
import { saveAs } from 'file-saver'
import { unparse } from 'papaparse'
import { ValidType, type CsvData, type CsvKeyValuePair } from '../../types/csv-export'

const emit = defineEmits<{
  (event: 'export-started', data: CsvData): void
  (event: 'export-finished', data: string): void
}>()

const props = defineProps({
  data: {
    type: Array as PropType<CsvData>,
    required: true,
  },
  fields: {
    type: Array<string>,
    required: false,
    default: null,
  },
  labels: {
    type: Object as PropType<CsvKeyValuePair> | null,
    required: false,
    default: null,
  },
  filename: {
    type: String,
    default: 'report-data.csv',
  },
  delimiter: {
    type: String,
    default: ',',
    required: false,
  },
  separatorExcel: {
    type: Boolean,
    default: false,
  },
  encoding: {
    type: String,
    default: 'utf-8',
  },
  testing: {
    type: Boolean,
    required: false,
    default: false,
  },
})

const idName = computed(() => `export_${new Date().getTime()}`)

const exportableData: ComputedRef<CsvData | null> = computed(() => {
  const filteredData: CsvData = cleaningData()

  return filteredData.length ? filteredData : null
})

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const labelsFunctionGenerator = (): Function => {
  const labels: any = props.labels

  if (typeof props.fields as ValidType !== ValidType.Object) {
    throw new Error('Labels needs to be a object containing key / value pairs.')
  }

  if (typeof labels as ValidType === ValidType.Object) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    return (item: Function) => mapKeys(item, (_, key) => labels[key] || key)
  }

  // @ts-ignore: valid return
  return item => item
}

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
const fieldsFunctionGenerator = (): Function => {
  const fields: any = props.fields

  if (typeof props.fields as ValidType !== ValidType.Object && !Array.isArray(fields)) {
    throw new Error('Fields needs to be an array of strings.')
  }

  if (Array.isArray(fields)) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    return (item: Function) => pick(item, fields)
  }

  // @ts-ignore: valid return type
  return item => item
}

const cleaningData = (): CsvData => {
  if (typeof props.fields as ValidType === ValidType.Undefined &&
    typeof props.labels as ValidType === ValidType.Undefined) {
    return props.data
  }

  const labels = labelsFunctionGenerator()
  const fields = fieldsFunctionGenerator()

  return props.data.map(item => labels(fields(item))) as CsvData
}

const generate = () => {
  if (!exportableData.value) {
    console.warn('No data to export')
    return
  }

  emit('export-started', exportableData.value)

  let csv = unparse(exportableData.value, Object.assign({
    delimiter: props.delimiter,
    encoding: props.encoding,
  }))

  if (props.separatorExcel) {
    csv = 'SEP=' + props.delimiter + '\r\n' + csv
  }

  if (props.encoding === 'utf-8') {
    csv = '\ufeff' + csv
  }

  emit('export-finished', props.filename)

  if (!props.testing) {
    const blob = new Blob([csv], {
      type: 'text/csv;charset=' + props.encoding,
    })

    saveAs(blob, props.filename)
  }
}
</script>
