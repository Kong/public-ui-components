<template>
  {{ text }}<span v-if="appendSpace">&nbsp;</span>
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
  appendSpace: {
    type: Boolean,
    default: false,
  },
})
</script>
