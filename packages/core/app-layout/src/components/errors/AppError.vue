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
@use "../../styles/variables" as *;

.kong-ui-app-error {
  align-items: center;
  background-color: var(--kui-color-background, $kui-color-background);
  border-top: var(--kui-border-width-20, $kui-border-width-20) solid #00abd2;
  display: flex;
  flex-direction: column;
  margin: var(--kui-space-90, $kui-space-90) var(--kui-space-auto, $kui-space-auto) var(--kui-space-0, $kui-space-0);
  padding-bottom: var(--kui-space-110, $kui-space-110);
  width: 100%;

  @media (min-width: $kui-breakpoint-mobile) {
    width: 80%;
  }

  @media (min-width: $kui-breakpoint-tablet) {
    max-width: 840px;
  }

  .banana-icon {
    animation-delay: 0.75s;
    margin: var(--kui-space-90, $kui-space-90) var(--kui-space-auto, $kui-space-auto) var(--kui-space-80, $kui-space-80);
  }

  .kong-ui-app-error-content {
    animation: .75s cubic-bezier(.785, .135, .15, .86) forwards fadeIn;
    opacity: 0;
    padding: var(--kui-space-0, $kui-space-0) var(--kui-space-60, $kui-space-60);

    @media (min-width: $kui-breakpoint-phablet) {
      padding: var(--kui-space-0, $kui-space-0) var(--kui-space-90, $kui-space-90);
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
    color: var(--kui-color-text-neutral, $kui-color-text-neutral);
    font-size: var(--kui-font-size-40, $kui-font-size-40);
    text-align: center;

    h1, h2, h3, h4 {
      color: var(--kui-color-text, $kui-color-text);
      font-size: var(--kui-font-size-80, $kui-font-size-80);
      font-weight: var(--kui-font-weight-semibold, $kui-font-weight-semibold);
      margin-bottom: var(--kui-space-60, $kui-space-60);
      margin-top: var(--kui-space-0, $kui-space-0);
    }
  }
}
</style>
