<template>
  <span
    class="chart-export-button-display"
    data-testid="csv-export-button"
    @click.prevent="exportCsv"
  >
    {{ text || i18n.t('csvExport.exportButton') }}
  </span>
  <CsvExportModal
    v-if="exportModalVisible"
    :chart-data="data"
    :filename="csvFilename"
    @toggle-modal="setModalVisibility"
  />
</template>
<script setup lang="ts">

import { computed, ref } from 'vue'
import type { PropType } from 'vue'
import type { ExploreResultV4 } from '@kong-ui-public/analytics-utilities'
import CsvExportModal from './CsvExportModal.vue'
import composables from '../composables'

const props = defineProps({
  data: {
    type: Object as PropType<ExploreResultV4>,
    required: true,
  },
  text: {
    type: String,
    required: false,
    default: undefined,
  },
  filenamePrefix: {
    type: String,
    required: false,
    default: undefined,
  },
})

const { i18n } = composables.useI18n()
const csvFilename = computed<string>(() => props.filenamePrefix || i18n.t('csvExport.defaultFilename'))
const exportModalVisible = ref(false)

const setModalVisibility = (val: boolean) => {
  exportModalVisible.value = val
}
const exportCsv = () => {
  setModalVisibility(true)
}

</script>
