export interface Field {
  label: string
  model: string
  type?: string
  default?: any
  disabled?: boolean
  help?: string
  inputType?: string
  order?: number
  required?: boolean
  valueType?: string
}

export default function useRedisPartial(formSchema: any, formModel?: any) {
  const redisFields: Field[] = []
  const isRedisField = (field: Field): boolean => {
    const excludePatterns = ['cluster-cache','cluster_cache']
    for (const pattern of excludePatterns) {
      if (field.model.includes(pattern)) {
        return false
      }
    }
    return /(-|_)redis(-|_)/.test(field.model)
  }
  formSchema.fields.forEach((field: Field) => {
    if (isRedisField(field)) {
      redisFields.push(field)
    }
  })
  return {
    redis: {
      id: '_redis',
      fields: redisFields,
      model: 'redis_partial', // todo: replace with actual model name
    },
    redisModels: redisFields.map((field: Field) => field.model),
  }
}
