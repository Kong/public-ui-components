<template>
  <Transition
    enter-active-class="ff-slide-active"
    leave-active-class="ff-slide-active"
    @after-enter="afterEnter"
    @after-leave="afterLeave"
    @before-enter="beforeEnter"
    @before-leave="beforeLeave"
    @enter="enter"
    @leave="leave"
  >
    <slot />
  </Transition>
</template>

<script setup lang="ts">
const properties = [
  'height',
  'padding-top',
  'padding-bottom',
  'margin-top',
  'margin-bottom',
  'border-top-width',
  'border-bottom-width',
] as const

const auto = Object.fromEntries(properties.map((prop) => [prop, '']))
const zero = Object.fromEntries(properties.map((prop) => [prop, '0']))

function getComputed(el: HTMLElement) {
  const styles = getComputedStyle(el)
  return Object.fromEntries(
    properties.map((prop) => [prop, styles.getPropertyValue(prop)]),
  )
}

function resetStyles(el: HTMLElement) {
  ['overflow', 'transition', ...properties].forEach((prop) =>
    el.style.removeProperty(prop),
  )
}

function beforeEnter(elem: Element) {
  const el = elem as HTMLElement

  Object.assign(el.style, {
    overflow: 'hidden',
    transition: 'none',
  })
}

function enter(elem: Element) {
  const el = elem as HTMLElement

  Object.assign(el.style, auto)

  const computed = getComputed(el)

  Object.assign(el.style, zero)

  requestAnimationFrame(() => {
    Object.assign(el.style, {
      ...computed,
      transition: '',
    })
  })
}

function afterEnter(elem: Element) {
  const el = elem as HTMLElement

  resetStyles(el)
}

function beforeLeave(elem: Element) {
  const el = elem as HTMLElement

  Object.assign(el.style, {
    ...getComputed(el),
    overflow: 'hidden',
  })
}

function leave(elem: Element) {
  const el = elem as HTMLElement

  Object.assign(el.style, zero)
}

function afterLeave(elem: Element) {
  const el = elem as HTMLElement

  resetStyles(el)
}
</script>

<style lang="scss" scoped>
.ff-slide-active {
  transition-duration: var(--kui-animation-duration-20, $kui-animation-duration-20);
  transition-property: height, padding, margin, border-width;
  transition-timing-function: ease-in-out;
}
</style>
