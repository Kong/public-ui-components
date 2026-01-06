<template>
  <div
    class="sandbox-container"
    :class="{ 'mobile-menu-open': isMobileMenuOpen }"
  >
    <!-- Mobile Header -->
    <header class="mobile-header">
      <h1 class="app-title">
        <RouterLink to="/">
          Monaco Editor Sandbox
        </RouterLink>
      </h1>
      <button
        :aria-expanded="isMobileMenuOpen"
        aria-label="Toggle mobile menu"
        class="menu-toggle"
        :class="{ 'mobile-menu-open': isMobileMenuOpen }"
        @click="toggleMobileMenu"
      >
        <span class="menu-icon" />
      </button>
    </header>

    <!-- Sidebar Navigation -->
    <aside
      class="sidebar"
      :class="{ 'mobile-menu-open': isMobileMenuOpen }"
    >
      <div class="sidebar-header">
        <h1 class="app-title">
          <RouterLink to="/">
            Monaco Editor Sandbox
          </RouterLink>
        </h1>
      </div>
      <nav class="nav-menu">
        <RouterLink
          v-for="route in filteredRoutes"
          :key="route.path"
          class="nav-link"
          :to="route.path"
          @click="toggleMobileMenu"
        >
          {{ route.meta?.title ?? route.name }}
        </RouterLink>
      </nav>
    </aside>

    <!-- Backdrop for mobile -->
    <div
      class="backdrop"
      @click="toggleMobileMenu"
    />

    <!-- Main Content -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const routes = computed(() => router.getRoutes())
const filteredRoutes = computed(() => routes.value.filter(route => route.name))

const isMobileMenuOpen = ref<boolean>(false)

const toggleMobileMenu = (): void => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}
</script>

<style lang="scss">
html,
body {
  background: $kui-color-background;
  margin: $kui-space-0;
  overflow: hidden;
}
</style>


<style lang="scss" scoped>
.sandbox-container {
  display: flex;
  height: 100vh;
  overflow: hidden;

  .mobile-header {
    align-items: center;
    background: $kui-color-background;
    border-bottom: $kui-border-width-10 solid $kui-color-border;
    display: flex;
    height: 60px;
    justify-content: space-between;
    left: 0;
    padding: $kui-space-0 $kui-space-60;
    position: fixed;
    right: 0;
    top: 0;
    z-index: 100;

    @media (min-width: 768px) {
      display: none;
    }

    .app-title {
      font-size: $kui-font-size-40;
      font-weight: $kui-font-weight-semibold;
      margin: $kui-space-0;
    }

    .menu-toggle {
      background: none;
      border: none;
      cursor: pointer;
      height: 32px;
      padding: $kui-space-0;
      position: relative;
      width: 32px;

      .menu-icon {
        background: $kui-color-background-neutral;
        border-radius: $kui-border-radius-10;
        display: block;
        height: 2px;
        position: relative;
        transition: background-color 0.3s ease;
        width: 24px;

        &::before,
        &::after {
          background: $kui-color-background-neutral;
          border-radius: $kui-border-radius-10;
          content: '';
          height: 2px;
          left: 0;
          position: absolute;
          transition: all 0.3s ease;
          width: 24px;
        }

        &::before {
          top: -8px;
        }

        &::after {
          top: 8px;
        }
      }

      &.mobile-menu-open .menu-icon {
        background: transparent;

        &::before {
          top: 0;
          transform: rotate(45deg);
        }

        &::after {
          top: 0;
          transform: rotate(-45deg);
        }
      }
    }
  }

  .sidebar {
    background: $kui-color-background-neutral-weakest;
    border-right: $kui-border-width-10 solid $kui-color-border;
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    width: 250px;
    z-index: 999;

    // Mobile: off-canvas
    @media (max-width: $kui-breakpoint-phablet) {
      bottom: 0;
      left: -250px;
      position: fixed;
      top: 0;
      transition: left 0.3s ease;

      &.mobile-menu-open {
        left: 0;
      }
    }

    .sidebar-header {
      border-bottom: $kui-border-width-10 solid $kui-color-border;
      padding: $kui-space-80 $kui-space-60;

      @media (max-width: 767px) {
        display: none;
      }

      .app-title {
        font-size: $kui-font-size-50;
        font-weight: $kui-font-weight-semibold;
        margin: $kui-space-0;
      }
    }

    .nav-menu {
      display: flex;
      flex-direction: column;

      @media (max-width: 767px) {
        padding-top: $kui-space-10;
      }

      .nav-link {
        color: $kui-color-text-neutral;
        display: block;
        font-size: $kui-font-size-30;
        font-weight: $kui-font-weight-medium;
        padding: $kui-space-50 $kui-space-60;
        text-decoration: none;
        transition: all 0.3s ease;

        &:hover {
          background: $kui-color-background-neutral-weakest;
          color: $kui-color-text-decorative-purple;
        }

        &.router-link-active {
          background: $kui-color-background-decorative-purple-weakest;
          border-right: 3px solid $kui-color-border-decorative-purple;
          color: $kui-color-text-decorative-purple;
          font-weight: $kui-font-weight-semibold;
        }
      }
    }
  }

  .app-title {
    a {
      color: $kui-color-text-decorative-purple;
      text-decoration: none;
    }
  }

  .backdrop {
    background: $kui-color-background-overlay;
    bottom: 0;
    left: 0;
    opacity: 0;
    pointer-events: none;
    position: fixed;
    right: 0;
    top: 0;
    transition: opacity 0.3s ease;
    z-index: 98;
  }

  .main-content {
    flex: 1;
    margin-top: $kui-space-10;
    overflow: hidden;

    @media (max-width: $kui-breakpoint-phablet) {
      margin-top: $kui-space-130;
    }
  }

  &.mobile-menu-open {
    .backdrop {
      @media (max-width: $kui-breakpoint-phablet) {
        opacity: 1;
        pointer-events: auto;
      }
    }
  }
}
</style>
