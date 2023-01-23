<template>
  <template v-for="node in $slots.default || []">
    <component :is="node" />
    &NewLine;
  </template>
</template>
