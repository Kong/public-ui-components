export type ProvideRhsValueCompletion = (lhsValue: string, rhsValueValue: string, lhsRange: monaco.Range, rhsValueRange: monaco.Range) => Promise<monaco.languages.CompletionList | undefined>
