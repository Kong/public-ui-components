<template>
  <a
    v-if="href"
    class="external-link"
    :href="href"
    rel="noopener"
    target="_blank"
  >
    <slot />
    <KIcon
      v-if="!hideIcon"
      class="ml-mb-auto"
      icon="externalLink"
      size="12"
    />
  </a>
</template>

<script setup lang="ts">
import { isValidUrl } from './helpers/isValidUrl'

defineProps({
  href: {
    type: String,
    required: true,
    validator: function(value:string) {
      return isValidUrl(value) || value === ''
    },
  },
  hideIcon: {
    type: Boolean,
    default: false,
  },
})
</script>

<style lang="scss">
// currentColor is not working in scoped
.external-link {
  .kong-icon-externalLink svg {
    path {
      fill: currentColor;
    }
  }
}
</style>

<style lang="scss" scoped>
.external-link {
  display: flex;
  align-items: center;
  text-decoration: none;

  .kong-icon-externalLink svg {
    margin-left: 8px;
  }
  .ml-mb-auto {
    margin-left: auto;
    margin-bottom: auto;
  }
}
</style>
