<template>
  <li>
    <slot />
  </li>
</template>

<style scoped>
li:not(:first-of-type) {
  margin-top: 8px;
}
</style>
