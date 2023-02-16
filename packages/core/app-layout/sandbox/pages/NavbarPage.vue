<template>
  <div class="navbar-page">
    <AppNavbar :left-offset="0">
      <div class="kong-logo d-flex w-100">
        <router-link
          class="d-flex align-items-center w-100"
          to="/"
        >
          <AppGruceLogo />
          <div class="d-flex pl-4 konnect-header-title">
            <AppLogo theme="dark" />
          </div>
        </router-link>
      </div>
      <template #mobile-logo>
        <a
          class="navbar-logo-link"
          href="/"
        >
          <AppGruceLogo />
          <div class="logo-title">
            <AppLogo theme="light" />
          </div>
        </a>
      </template>
      <NavLinks />
    </AppNavbar>
    <div class="sandbox-container">
      <main>
        <p>This is the NAVBAR page.</p>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { AppNavbar } from '../../src'
import { AppLogo, AppGruceLogo } from '../components/icons'
// Sandbox only
import NavLinks from '../components/NavLinks.vue'
</script>

<style lang="scss" scoped>
main {
  width: 100%;
  background: #fff;
  min-height: 2000px; // fake a height so the container scrolls
  margin: 60px 0 0; // $navbar-height
  padding: 16px;
}

.navbar-logo-link {
  display: flex;
  align-items: center;
}

.logo-title {
  display: none;
  padding-left: 16px;

  @media (min-width: 640px) { // $viewport-sm
    display: flex;
  }
}
</style>

<style lang="scss">
body {
  background: var(--kong-ui-app-layout-background, linear-gradient(180deg, #001740 0%, #073382 100%));
  margin: 0 !important;
}
</style>
