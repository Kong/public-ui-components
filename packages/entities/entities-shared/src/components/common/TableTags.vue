<template>
  <KTruncate v-if="tags?.length > 0">
    <KBadge
      v-for="tag in tags"
      :key="tag"
      :max-width="tagMaxWidth"
      @click.stop
    >
      {{ tag }}
    </KBadge>
  </KTruncate>
  <span v-else>-</span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { KTruncate, KBadge } from '@kong/kongponents'

const props = defineProps({
  /** The tags to display in the table */
  tags: {
    type: [Array, String],
    required: true,
  },
  tagMaxWidth: {
    type: String,
    default: undefined,
  },
})

/**
 * Normalize tags to an array
 * Filtering APIs sometimes return tags as a stringified array so we need to normalize it
 */
const tags = computed(() => {
  if (Array.isArray(props.tags)) {
    return props.tags
  }

  if (typeof props.tags === 'string') {
    try {
      const parsedTags = JSON.parse(props.tags)
      if (Array.isArray(parsedTags)) {
        return parsedTags
      }
      return []
    } catch (e) {
      return []
    }
  }

  return []
})
</script>
