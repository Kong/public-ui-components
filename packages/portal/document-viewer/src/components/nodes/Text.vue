<template>
  {{ text }}<span v-if="appendSpace">&nbsp;</span><br v-if="hardBreak">
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
  hardBreak: {
    type: Boolean,
    default: false,
  },
})
</script>
