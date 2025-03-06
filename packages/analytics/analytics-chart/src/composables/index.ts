import useI18n from './useI18n'
import useBarChartOptions from './useBarChartOptions'
import useChartJSCommon from './useChartJSCommon'
import useChartLegendValues from './useChartLegendValues'
import useChartSelectedRange from './useChartSelectedRange'
import useDonutChartOptions from './useDonutChartOptions'
import useLinechartOptions from './useLineChartOptions'
import useExploreResultToDatasets from './useExploreResultToDatasets'
import useExploreResultToTimeDataset from './useExploreResultToTimeDatasets'
import useReportChartDataForSynthetics from './useReportChartDataForSynthetics'
import useTranslatedUnits from './useTranslatedUnits'
import useEvaluateFeatureFlag from './useEvauluateFeatureFlag'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useBarChartOptions,
  useChartJSCommon,
  useChartLegendValues,
  useChartSelectedRange,
  useExploreResultToDatasets,
  useExploreResultToTimeDataset,
  useDonutChartOptions,
  useLinechartOptions,
  useI18n,
  useReportChartDataForSynthetics,
  useTranslatedUnits,
  useEvaluateFeatureFlag,
}
