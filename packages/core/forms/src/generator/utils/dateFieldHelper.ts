// @ts-nocheck
import fecha from 'fecha'

export default {
  formatValueToField(value:any) {
    if (value != null) {
      const dt = this.schema.format ? fecha.parse(value, this.schema.format) : new Date(value)
      return fecha.format(dt, this.getDateFormat())
    }

    return value
  },

  formatValueToModel(value) {
    if (value != null) {
      const m = fecha.parse(value, this.getDateFormat())
      if (this.schema.format) {
        value = fecha.format(m, this.schema.format)
      } else {
        value = m.valueOf()
      }
    }

    return value
  },
}
