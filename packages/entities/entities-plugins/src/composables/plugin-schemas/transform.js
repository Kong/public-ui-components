import { getAutodocField } from './autodoc'
import { marked } from 'marked'

export const applyAutodocDesc = (o, entity, field) => {
  const f = getAutodocField(entity, field)
  if (f && f.desc) {
    o.help = marked.parse(f.desc)
  }
}
