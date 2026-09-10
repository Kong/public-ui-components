import english from '../locales/en.json'

// Narrow dynamic names to known keys before passing them to the typed translation API.
export const isChartLabel = (name: string): name is keyof typeof english.chartLabels => Object.hasOwn(english.chartLabels, name)
