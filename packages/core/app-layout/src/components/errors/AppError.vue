<template>
  <section class="kong-ui-app-error">
    <div class="banana-icon">
      <BananaSplit />
    </div>

    <div class="kong-ui-app-error-content">
      <slot name="default">
        <h2>An unexpected error has occurred</h2>
        <p>Go back to the previous page or <a href="/">return home</a>.</p>
      </slot>
    </div>
  </section>
</template>

<script setup lang="ts">
import BananaSplit from '../icons/BananaSplit.vue'
</script>

<style lang="scss" scoped>
@import "../../styles/variables";

.kong-ui-app-error {
  align-items: center;
  background-color: $kui-color-background;
  border-top: $kui-space-10 solid $kui-color-text-decorative;
  display: flex;
  flex-direction: column;
  margin: $kui-space-90 $kui-space-auto $kui-space-0;
  padding-bottom: $kui-space-110;
  width: 100%;

  @media (min-width: $kui-breakpoint-mobile) {
    width: 80%;
  }

  @media (min-width: $kui-breakpoint-tablet) {
    max-width: 840px;
  }

  .banana-icon {
    animation-delay: 0.75s;
    margin: $kui-space-90 $kui-space-auto $kui-space-80;
  }

  .kong-ui-app-error-content {
    animation: .75s cubic-bezier(.785, .135, .15, .86) forwards fadeIn;
    opacity: 0;
    padding: $kui-space-0 $kui-space-60;

    @media (min-width: $kui-breakpoint-phablet) {
      padding: $kui-space-0 $kui-space-90;
    }

    @media (prefers-reduced-motion) {
      animation: none;
      opacity: 1;
    }
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<style lang="scss">
// Leave unscoped to style error slot content
.kong-ui-app-error {
  .kong-ui-app-error-content {
    color: $kui-color-text-neutral;
    font-size: 16px;
    text-align: center;

    h1, h2, h3, h4 {
      color: $kui-color-text;
      font-size: $kui-font-size-80;
      font-weight: $kui-font-weight-semibold;
      margin-bottom: $kui-space-60;
      margin-top: $kui-space-0;
    }
  }
}
</style>
