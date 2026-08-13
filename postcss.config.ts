import type { AcceptedPlugin } from 'postcss'
import postcssCustomProperties from 'postcss-custom-properties'

export default () => ({
  plugins: [
    postcssCustomProperties({ preserve: true }),
  ] satisfies AcceptedPlugin[],
})
