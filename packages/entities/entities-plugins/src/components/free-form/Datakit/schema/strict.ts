import { validateGraph } from './graph-validation'
import { DatakitConfigSchemaBase } from './config-base'

export * from './config-base'

export const DatakitConfigSchema = DatakitConfigSchemaBase.superRefine((config, ctx) => {
  const issues = validateGraph(config, { mode: 'strict' })
  for (const issue of issues) {
    ctx.addIssue({
      code: 'custom',
      message: issue.message,
      path: issue.path,
    })
  }
})
