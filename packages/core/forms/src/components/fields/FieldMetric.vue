<template>
  <div
    class="field-dropdown"
    :class="{ active: contentVisible }"
  >
    <div
      class="title"
      @click="contentVisible = !contentVisible"
    >
      {{ model.name ? model.name : 'New Item' }}
      <AddIcon class="metric-add-icon" />
    </div>
    <transition name="slide-fade">
      <div
        v-if="contentVisible"
        class="content"
      >
        <slot />
        <KButton
          appearance="tertiary"
          class="metric-remove-button"
          @click="$emit('remove-item')"
        >
          <TrashIcon />
        </KButton>
      </div>
    </transition>
  </div>
</template>

<script>
import { AddIcon, TrashIcon } from '@kong/icons'
import abstractField from './abstractField'

export default {
  name: 'FieldMetric',
  components: { AddIcon, TrashIcon },
  mixins: [abstractField],
  emits: ['remove-item'],

  data() {
    return {
      contentVisible: false,
    }
  },
}
</script>

<style lang="scss">
.slide-fade-enter-active,
.slide-fade-leave-active {
  padding: 0;
  transition: all .5s;
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  max-height: 0 !important;
}

.metrics-wrapper {
  width: 100%;

  .btn,
  .metrics-wrapper i {
    cursor: pointer;
  }
}

.field-dropdown {
  .title {
    align-items: center;
    background-color: var(--kui-color-background-neutral-weakest, $kui-color-background-neutral-weakest);
    border-bottom: 1px solid #eee;
    cursor: pointer;
    display: flex;
    height: 45px;
    padding: 0 16px;
    position: relative;
    transition: transform .2s cubic-bezier(0.41,0.35,1,0.28) 0s, background-color .2s ease-in;
    width: 100%;

    &:hover { background-color: #f5f5f5; }
  }

  .metric-add-icon {
    margin-left: auto;
    transition: all .7s;
    user-select: none;
  }

  .content {
    border: 1px solid #eee;
    border-top: 0;
    height: auto;
    overflow: hidden;
    transition: all .5s;

    .metric-remove-button {
      float: right;
      margin-bottom: 16px;
      margin-right: 16px;
    }

    .vue-form-generator {
      padding: 16px;
    }
  }

  &.active .title .metric-add-icon {
    transform: rotate(45deg);
  }
}
</style>
