export function getFreeFormName(modelName: string): string {
  const mapping: Record<string, string> = {
    'request-callout': 'RequestCalloutForm',
  }

  return mapping[modelName]
}
