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
  background-color: #fff;
  border-top: 3px solid var(--teal-300, #169fcc);
  display: flex;
  flex-direction: column;
  margin: 32px auto 0;
  padding-bottom: 48px;
  width: 100%;

  @media (min-width: $viewport-sm) {
    width: 80%;
  }

  @media (min-width: $viewport-lg) {
    max-width: 840px;
  }

  .banana-icon {
    animation-delay: 0.75s;
    margin: 32px auto 24px;
  }

  .kong-ui-app-error-content {
    animation: .75s cubic-bezier(.785, .135, .15, .86) forwards fadeIn;
    opacity: 0;
    padding: 0 16px;

    @media (min-width: $viewport-md) {
      padding: 0 36px;
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
    color: var(--grey-500, #6f7787);
    font-size: 16px;
    text-align: center;

    h1, h2, h3, h4 {
      color: var(--black-500, #0b172d);
      font-size: 32px;
      font-weight: 600;
      margin-bottom: 16px;
      margin-top: 0;
    }
  }
}
</style>
