<template>
  <div class="kong-ui-public-split-pane-toolbar">
    <div
      v-if="!!$slots.left"
      class="left"
    >
      <slot name="left" />
    </div>
    <div
      v-if="!!$slots.center"
      class="center"
    >
      <slot name="center" />
    </div>
    <div
      v-if="!!$slots.right"
      class="right"
    >
      <slot name="right" />
    </div>
  </div>
</template>

<style lang="scss" scoped>
$toolbar-height: 44px;

.kong-ui-public-split-pane-toolbar {
  align-items: center;
  background: $kui-color-background;
  border-bottom: $kui-border-width-10 solid $kui-color-border;
  display: flex;
  flex: 0 0 $toolbar-height;
  justify-content: space-between;
  min-height: $toolbar-height;
  overflow-x: auto;
  overflow-y: hidden;
  padding-left: $kui-space-40;
  padding-right: $kui-space-40;
  position: sticky;
  scrollbar-width: thin;
  top: 0;
  z-index: 3; // Keep over the sidebars
}

.left,
.right,
.center {
  align-items: center;
  display: flex;
  gap: $kui-space-40;
  height: 100%;
}

.left,
.right {
  flex: 1 1 0%;
}

.right {
  justify-content: flex-end;
}
</style>
