<template>
  <div class="navbar-links">
    <router-link to="/">
      AppLayout.vue
    </router-link>
    <router-link to="/navbar">
      AppNavbar.vue
    </router-link>
    <router-link to="/sidebar">
      AppSidebar.vue
    </router-link>
  </div>
</template>

<style lang="scss" scoped>
.navbar-links {
  display: flex;
  align-items: center;
  margin-left: auto;

  a {
    color: var(--black-500);
    background-color: var(--grey-200);
    margin-right: 8px;
    padding: 4px 8px;
    border-radius: 4px;
    text-decoration: none;
    font-weight: 500;
    transition: all .2s ease-in-out;

    &:hover {
      background-color: var(--grey-300);
    }

    &.router-link-active {
      color: #fff;
      background-color: var(--blue-500);
    }
  }

}
</style>
