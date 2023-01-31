<template>
  {{ text }}<br v-if="hardBreak">
</template>

<script lang="ts">
export default {
  inheritAttrs: false,
}
</script>
<script setup lang="ts">
defineProps({
  text: {
    type: String,
    required: true,
  },
  hardBreak: {
    type: Boolean,
    default: false,
  },
})
</script>
