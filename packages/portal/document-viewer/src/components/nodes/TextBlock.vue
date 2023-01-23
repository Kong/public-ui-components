<template>
  <template
    v-for="node in $slots.default || []"
  >
    <!-- eslint-disable-next-line vue/valid-v-for -->
    <component :is="node" />
    &NewLine;
  </template>
</template>
