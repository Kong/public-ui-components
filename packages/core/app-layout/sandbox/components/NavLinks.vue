<template>
  <div class="navbar-links">
    <router-link to="/">
      <span>AppLayout.vue</span>
    </router-link>
    <router-link to="/navbar">
      <span>AppNavbar.vue</span>
    </router-link>
    <router-link to="/sidebar">
      <span>AppSidebar.vue</span>
    </router-link>
  </div>
</template>

<style lang="scss" scoped>
.navbar-links {
  display: flex;
  align-items: center;
  height: 100%;
  margin-left: auto;

  a {
    color: var(--white, #fff);
    border-bottom: 4px solid transparent;
    display: flex;
    align-items: center;
    align-self: stretch;

    padding: 0 16px;
    text-decoration: none;
    font-size: 16px;
    font-weight: 500;
    transition: all .2s ease-in-out;

    span {
      display: block;
    }

    &.router-link-active,
    &.active {
      font-weight: 700 !important;
      border-color: var(--green-300, #84E5AE);
    }
  }

}
</style>
