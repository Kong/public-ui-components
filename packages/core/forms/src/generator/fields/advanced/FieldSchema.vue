<template>
  <div
    class="field-dropdown"
    :class="{ active: contentVisible }"
  >
    <div
      class="title"
      @click="contentVisible = !contentVisible"
    >
      {{ model.name ? model.name : 'New Schema' }}
      <i class="material-icons">add</i>
    </div>
    <transition name="slide-fade">
      <div
        v-if="contentVisible"
        class="content"
      >
        <slot />
        <i
          class="material-icons float-right mr-2 mb-2"
          @click="$emit('remove-item')"
        >
          delete
        </i>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'FieldSchema',

  props: {
    model: {
      type: Object,
      default: null,
    },
  },

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
    align-items:center;
    background-color: var(--grey-100);
    border-bottom: 1px solid #eee;
    cursor: pointer;
    display: flex;
    height: 45px;
    padding: 0 16px 0 5px;
    position: relative;
    transition: transform .2s cubic-bezier(0.41,0.35,1,0.28) 0s, background-color .2s ease-in;
    width: 100%;
    &:hover { background-color: #f5f5f5; }
  }
  i {
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
    i:hover { color: #c9302c; }
    .vue-form-generator { padding: 16px; }
  }
  &.active .title i { transform: rotate(135deg); }
}
</style>
