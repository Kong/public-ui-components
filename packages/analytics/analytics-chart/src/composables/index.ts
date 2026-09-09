import useI18n from './useI18n'
import useBarChartOptions from './useBarChartOptions'
import useChartJSCommon from './useChartJSCommon'
import useChartLegendValues from './useChartLegendValues'
import useChartSelectedRange from './useChartSelectedRange'
import useDonutChartOptions from './useDonutChartOptions'
import useLineChartOptions from './useLineChartOptions'
import useScatterChartOptions from './useScatterChartOptions'
import useExploreResultToDatasets from './useExploreResultToDatasets'
import useExploreResultToTimeDataset from './useExploreResultToTimeDatasets'
import useScatterDatasets from './useScatterDatasets'
import useReportChartDataForSynthetics from './useReportChartDataForSynthetics'
import useTranslatedUnits from './useTranslatedUnits'
import useEvaluateFeatureFlag from './useEvauluateFeatureFlag'
import useTooltipAbsolutePosition from './useTooltipAbsolutePosition'
import useSparklineSync from './useSparklineSync'

// All composables must be exported as part of the default object for Cypress test stubs
export default {
  useBarChartOptions,
  useChartJSCommon,
  useChartLegendValues,
  useChartSelectedRange,
  useExploreResultToDatasets,
  useExploreResultToTimeDataset,
  useScatterDatasets,
  useDonutChartOptions,
  useLineChartOptions,
  useScatterChartOptions,
  useI18n,
  useReportChartDataForSynthetics,
  useTranslatedUnits,
  useEvaluateFeatureFlag,
  useTooltipAbsolutePosition,
  useSparklineSync,
}
