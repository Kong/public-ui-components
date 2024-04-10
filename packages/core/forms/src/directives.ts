import type { ObjectDirective, DirectiveBinding, VNode } from 'vue'
import {
  get as objGet,
  forEach,
  isString,
} from 'lodash'

const bindFieldTypeAttrs = (el: any, binding: DirectiveBinding<any>, vnode: VNode<any, any, { [key: string]: any }>) => {
  const container = binding.value || 'input'
  let attrs = objGet(vnode.props, 'schema.attributes', {})

  if (isString(container)) {
    attrs = objGet(attrs, container) || attrs
  }

  forEach(attrs, (val, key) => {
    el.setAttribute(key, val)
  })
}

const attributesDirective: ObjectDirective = {
  beforeMount(el, binding, vnode) {
    bindFieldTypeAttrs(el, binding, vnode)
  },
  updated(el, binding, vnode) {
    bindFieldTypeAttrs(el, binding, vnode)
  },
  // Vue 3 does not have a "componentUpdated" lifecycle hook equivalent
}

export default attributesDirective
