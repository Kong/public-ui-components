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

export default function useRedisPartial(formSchema: any) {
  const redisFields: Field[] = []
  const isRedisField = (field: Field): boolean => {
    const excludePatterns = ['cluster-cache', 'cluster_cache']
    for (const pattern of excludePatterns) {
      if (field.model.includes(pattern)) {
        return false
      }
    }
    return /(?<=-redis-).*/.test(field.model)
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
      model: '__redis_partial',
      redisType: formSchema._supported_redis_partial_type,
      redisPath: formSchema._redis_partial_path,
    },
    redisModels: redisFields.map((field: Field) => field.model),
  }
}
