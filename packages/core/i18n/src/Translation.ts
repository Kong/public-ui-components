import { defineComponent, h } from 'vue'
import type { VNodeChild, App, PropType } from 'vue'
import type {
  IntlShapeEx,
  // PathToDotNotation, // Enable import to debug `keypath` interface
} from './types'

export const i18nTComponent = <MessageSource = any>(i18n: IntlShapeEx<MessageSource> | null = null) => defineComponent({
  name: 'I18nT',
  props: {
    i18n: {
      type: Object as PropType<IntlShapeEx<MessageSource>>,
      default: null,
    },
    keypath: {
      type: String,
      // type: String as unknown as PropType<PathToDotNotation<MessageSource, string>>, // This breaks the type interface, enable to debug
      required: true,
    },
    tag: {
      type: String,
      default: 'span',
    },
  },
  setup(props, { slots }) {
    //  deconstructString('Previewing {rowsMax} of {rowsTotal} rows')
    //  Result: (5)['Previewing ', '{rowsMax}', ' of ', '{rowsTotal}', ' rows']

    /**
     * Deconstruct the given translation string, splitting into an array based on `{(.*)}` matches
     * @param {string} str The translation string to split
     * @return {string[]} An array of strings
     */
    const deconstructString = (str: string): string[] => {
      if (!str) {
        return []
      }

      const matchRegex = /(\{[^}]+\})/g

      return str.split(matchRegex).filter(Boolean)
    }

    return (): VNodeChild => {
      const keys = Object.keys(slots).filter(key => key !== '_')
      const sourceString = (i18n || props.i18n).messages[(props.keypath as string)].toString()

      let hArray: Array<any> = deconstructString(sourceString)

      hArray = hArray.filter(a => a !== '')

      // replacing slots
      hArray.forEach((element: string, i: number) => {
        if (!element.startsWith('{') && !element.endsWith('}')) {
          return
        }
        // eslint-disable-next-line
        const stripped = element.replace(/[\{\}]/g, '')
        if (stripped === '0' && slots.default) {
          hArray[i] = slots.default()
        } else if (keys.includes(stripped) && slots[stripped]) {
          // @ts-ignore
          hArray[i] = slots[stripped]()
        }
      })
      return h(props.tag, props, hArray)
    }
  },
})

// Export Vue plugin
export default {
  install<MessageSource = any>(app: App, options: { i18n: IntlShapeEx<MessageSource> }) {
    const { i18n } = options
    app.component('I18nT', i18nTComponent<MessageSource>(i18n))
  },
}
