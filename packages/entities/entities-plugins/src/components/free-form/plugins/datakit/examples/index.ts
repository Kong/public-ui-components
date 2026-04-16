import { camelCase } from 'lodash-es'

export type DatakitExample = {
  id: string
  i18nKey: string
  code: string
}

const exampleModules = import.meta.glob('./*.yaml', {
  eager: true,
  import: 'default',
  query: '?raw',
}) as Record<string, string>

const examples: DatakitExample[] = Object.entries(exampleModules)
  .sort(([a], [b]) => a.localeCompare(b))
  .map(([path, code]) => {
    const id = path.replace(/^\.\//, '').replace(/\.yaml$/, '')

    return {
      id,
      i18nKey: camelCase(id),
      code,
    }
  })

export default examples
