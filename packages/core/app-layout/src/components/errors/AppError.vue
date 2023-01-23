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
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 32px auto 0;
  padding-bottom: 48px;
  border-top: 3px solid var(--teal-300, #169fcc);
  background-color: #fff;
  width: 100%;

  @media (min-width: $viewport-sm) {
    width: 80%;
  }

  @media (min-width: $viewport-lg) {
    max-width: 840px;
  }

  .banana-icon {
    margin: 32px auto 24px;
    animation-delay: 0.75s;
  }

  .kong-ui-app-error-content {
    padding: 0 16px;
    opacity: 0;
    animation: .75s cubic-bezier(.785, .135, .15, .86) forwards fadeIn;

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
    transform: translateY(50px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
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
      margin-top: 0;
      margin-bottom: 16px;
      font-size: 32px;
      font-weight: 600;
    }
  }
}
</style>
