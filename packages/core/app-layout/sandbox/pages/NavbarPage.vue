<template>
  <div class="navbar-page">
    <AppNavbar :left-offset="0">
      <template #logo>
        <router-link
          class="desktop-logo"
          to="/"
        >
          <AppGruceLogo />
          <div class="konnect-header-title">
            <AppLogo theme="dark" />
          </div>
        </router-link>
      </template>
      <template #mobile-logo>
        <a
          class="navbar-logo-link"
          href="/"
        >
          <AppGruceLogo />
          <div class="logo-title">
            <AppLogo theme="dark" />
          </div>
        </a>
      </template>
      <template #left>
        <NavLinks />
      </template>
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
  background: #fff;
  border-top-left-radius: 0;
  box-shadow: var(--kong-ui-app-layout-main-box-shadow, -30px 174px 250px #0023db);
  margin: 60px 0 0; // $navbar-height
  min-height: 2000px; // fake a height so the container scrolls
  padding: 16px;
  width: 100%;
}

.navbar-logo-link {
  align-items: center;
  display: flex;
}

.logo-title {
  display: none;
  padding-left: 16px;

  @media (min-width: 640px) { // $kui-breakpoint-mobile
    display: flex;
  }
}

.desktop-logo {
  display: none;

  @media (min-width: 1024px) { // $kui-breakpoint-tablet
    align-items: center;
    display: flex;
  }
}

.konnect-header-title {
  display: flex;
  padding-left: 16px;
}
</style>

<style lang="scss">
body {
  background: var(--kong-ui-app-layout-background, linear-gradient(180deg, #001740 0%, #073382 100%));
  margin: 0 !important;
}
</style>
