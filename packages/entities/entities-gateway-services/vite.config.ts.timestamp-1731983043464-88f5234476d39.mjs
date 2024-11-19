// ../../../vite.config.shared.ts
import { defineConfig, loadEnv } from "file:///Users/yiling.gu@konghq.com/Developer/Kong/public-ui-components/node_modules/.pnpm/vite@5.4.10_@types+node@18.19.64_sass-embedded@1.80.3_sass@1.80.6_terser@5.26.0/node_modules/vite/dist/node/index.js";
import vue from "file:///Users/yiling.gu@konghq.com/Developer/Kong/public-ui-components/node_modules/.pnpm/@vitejs+plugin-vue@5.1.4_vite@5.4.10_@types+node@18.19.64_sass-embedded@1.80.3_sass@1.80.6_te_56ghbtnpje3mm2qabodcbrcg2m/node_modules/@vitejs/plugin-vue/dist/index.mjs";
import vueJsx from "file:///Users/yiling.gu@konghq.com/Developer/Kong/public-ui-components/node_modules/.pnpm/@vitejs+plugin-vue-jsx@4.0.1_vite@5.4.10_@types+node@18.19.64_sass-embedded@1.80.3_sass@1.80._zq3fjnzvcfzr7af57t6u25duae/node_modules/@vitejs/plugin-vue-jsx/dist/index.mjs";
import VueDevTools from "file:///Users/yiling.gu@konghq.com/Developer/Kong/public-ui-components/node_modules/.pnpm/vite-plugin-vue-devtools@7.6.1_rollup@4.22.4_vite@5.4.10_@types+node@18.19.64_sass-embedded@1_y3drhxzrg7e2hm7ywfk5af44dy/node_modules/vite-plugin-vue-devtools/dist/vite.mjs";
import dns from "dns";
import path from "path";
import { visualizer } from "file:///Users/yiling.gu@konghq.com/Developer/Kong/public-ui-components/node_modules/.pnpm/rollup-plugin-visualizer@5.12.0_rollup@4.22.4/node_modules/rollup-plugin-visualizer/dist/plugin/index.js";
var __vite_injected_original_dirname = "/Users/yiling.gu@konghq.com/Developer/Kong/public-ui-components";
dns.setDefaultResultOrder("verbatim");
var buildVisualizerPlugin = process.env.BUILD_VISUALIZER ? visualizer({
  filename: path.resolve(__vite_injected_original_dirname, `packages/${process.env.BUILD_VISUALIZER}/bundle-analyzer/stats-treemap.html`),
  template: "treemap",
  // sunburst|treemap|network
  sourcemap: true,
  gzipSize: true
}) : void 0;
var sanitizePackageName = (packageName2) => {
  const sanitizedName = (packageName2 || "").replace(/Analytics/g, "Vitals").replace(/analytics/gi, "vitals");
  return sanitizedName;
};
var vite_config_shared_default = defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    VueDevTools()
  ],
  resolve: {
    // Use this option to force Vite to always resolve listed dependencies to the same copy (from project root)
    dedupe: ["vue", "vue-router", "@kong/kongponents"],
    alias: {
      "@entities-shared-sandbox": path.resolve(__vite_injected_original_dirname, "packages/entities/entities-shared/sandbox/shared")
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        api: "modern",
        // Inject the @kong/design-tokens SCSS variables to make them available for all components.
        additionalData: '@use "@kong/design-tokens/tokens/scss/variables" as *;'
      }
    }
  },
  build: {
    outDir: "./dist",
    cssCodeSplit: false,
    minify: true,
    sourcemap: !!process.env.BUILD_VISUALIZER,
    rollupOptions: {
      // Make sure to externalize deps that shouldn't be bundled into your library
      // If config.build.rollupOptions.external is also set at the package level, the arrays will be merged
      external: [
        "vue",
        "vue-router",
        "@kong/kongponents",
        "@kong/icons",
        "@kong-ui-public/i18n",
        "@kong-ui-public/entities-shared",
        "axios"
      ],
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          vue: "Vue",
          "vue-router": "VueRouter",
          "@kong-ui-public/i18n": "kong-ui-public-i18n",
          "@kong/kongponents": "Kongponents",
          "@kong/icons": "KongIcons",
          "@kong-ui-public/entities-shared": "kong-ui-public-entities-shared",
          axios: "axios"
        },
        exports: "named"
      },
      plugins: [
        // visualizer must remain last in the list of plugins
        buildVisualizerPlugin
      ]
    }
  },
  optimizeDeps: {
    include: [
      "vue",
      "vue-router"
    ]
  },
  // Change the root when utilizing the sandbox via USE_SANDBOX=true to use the `/sandbox/*` files
  // During the build process, the `/sandbox/*` files are not used and we should default to the package root.
  root: process.env.USE_SANDBOX ? "./sandbox" : process.cwd(),
  // Sets the Vite envDir to point to the repository root `.env.*` files.
  // Please do NOT add other .env files in child directories.
  envDir: "../../../../",
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: [],
    coverage: {
      reporter: ["text", "json", "html"]
    },
    deps: {
      optimizer: {
        web: {
          // https://github.com/vitest-dev/vitest/issues/4074
          exclude: ["vue"]
        }
      }
    },
    include: ["**/src/**/*.spec.ts"],
    exclude: [
      "**/dist/**",
      "**/__template__/**",
      "**/node_modules/**",
      "packages/core/cli/**"
    ]
  }
});
var getApiProxies = (pathToRoot = "../../../.") => {
  const env = loadEnv("development", pathToRoot, "");
  const konnectAuthHeader = env.VITE_KONNECT_PAT ? {
    authorization: `Bearer ${env.VITE_KONNECT_PAT}`
  } : void 0;
  const kongManagerAuthHeader = env.VITE_KONG_MANAGER_TOKEN ? {
    "kong-admin-token": env.VITE_KONG_MANAGER_TOKEN
  } : void 0;
  const availableRegions = ["au", "eu", "us"];
  const regionalProxies = {};
  for (const region of availableRegions) {
    regionalProxies[`^/${region}/kong-api`] = {
      target: (env.VITE_KONNECT_API ?? "").replace(/\{geo\}/, region),
      rewrite: (path2) => path2.replace(`/${region}/kong-api`, ""),
      changeOrigin: true,
      headers: {
        ...konnectAuthHeader
      }
    };
  }
  return {
    // Add Konnect API proxies
    ...regionalProxies,
    /**
     * /kong-ui/config JSON
     */
    "^/kong-ui/config": {
      target: env.VITE_KONNECT_CONFIG,
      changeOrigin: true
    },
    // KAuth v1 APIs
    "^/kauth": {
      target: env.VITE_KONNECT_KAUTH,
      changeOrigin: true,
      headers: {
        ...konnectAuthHeader
      }
    },
    // Global v2 APIs
    "^/kong-api/v2": {
      target: env.VITE_KONNECT_GLOBAL,
      rewrite: (path2) => path2.replace("/kong-api", ""),
      changeOrigin: true,
      headers: {
        ...konnectAuthHeader
      }
    },
    /**
     * KONG MANAGER PROXIES
     */
    "^/kong-manager": {
      target: env.VITE_KONG_MANAGER_API,
      rewrite: (path2) => path2.replace("/kong-manager", ""),
      changeOrigin: true,
      headers: {
        ...kongManagerAuthHeader
      }
    }
  };
};

// vite.config.ts
import { defineConfig as defineConfig2, mergeConfig } from "file:///Users/yiling.gu@konghq.com/Developer/Kong/public-ui-components/node_modules/.pnpm/vite@5.4.10_@types+node@18.19.64_sass-embedded@1.80.3_sass@1.80.6_terser@5.26.0/node_modules/vite/dist/node/index.js";
import { resolve } from "path";
var __vite_injected_original_dirname2 = "/Users/yiling.gu@konghq.com/Developer/Kong/public-ui-components/packages/entities/entities-gateway-services";
var packageName = "entities-gateway-services";
var sanitizedPackageName = sanitizePackageName(packageName);
var config = mergeConfig(vite_config_shared_default, defineConfig2({
  build: {
    lib: {
      // The kebab-case name of the exposed global variable. MUST be in the format `kong-ui-public-{package-name}`
      // Example: name: 'kong-ui-public-demo-component'
      name: `kong-ui-public-${sanitizedPackageName}`,
      entry: resolve(__vite_injected_original_dirname2, "./src/index.ts"),
      fileName: (format) => `${sanitizedPackageName}.${format}.js`
    }
  },
  server: {
    proxy: {
      // Add the API proxies to inject the Authorization header
      ...getApiProxies()
    }
  }
}));
if (process.env.USE_SANDBOX) {
  config.build.lib = void 0;
  config.build.rollupOptions.external = void 0;
  config.build.rollupOptions.output.global = void 0;
}
var vite_config_default = config;
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsiLi4vLi4vLi4vdml0ZS5jb25maWcuc2hhcmVkLnRzIiwgInZpdGUuY29uZmlnLnRzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3lpbGluZy5ndUBrb25naHEuY29tL0RldmVsb3Blci9Lb25nL3B1YmxpYy11aS1jb21wb25lbnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvVXNlcnMveWlsaW5nLmd1QGtvbmdocS5jb20vRGV2ZWxvcGVyL0tvbmcvcHVibGljLXVpLWNvbXBvbmVudHMvdml0ZS5jb25maWcuc2hhcmVkLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy95aWxpbmcuZ3VAa29uZ2hxLmNvbS9EZXZlbG9wZXIvS29uZy9wdWJsaWMtdWktY29tcG9uZW50cy92aXRlLmNvbmZpZy5zaGFyZWQudHNcIjsvLy8gPHJlZmVyZW5jZSB0eXBlcz1cInZpdGVzdFwiIC8+XG5cbi8qKlxuICogU2hhcmVkIFZpdGUgY29uZmlnIHNldHRpbmdzIGZvciBhbGwgY29tcG9uZW50c1xuICovXG5pbXBvcnQgeyBkZWZpbmVDb25maWcsIGxvYWRFbnYgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHZ1ZSBmcm9tICdAdml0ZWpzL3BsdWdpbi12dWUnXG5pbXBvcnQgdnVlSnN4IGZyb20gJ0B2aXRlanMvcGx1Z2luLXZ1ZS1qc3gnXG5pbXBvcnQgVnVlRGV2VG9vbHMgZnJvbSAndml0ZS1wbHVnaW4tdnVlLWRldnRvb2xzJ1xuaW1wb3J0IGRucyBmcm9tICdkbnMnXG5pbXBvcnQgcGF0aCBmcm9tICdwYXRoJ1xuaW1wb3J0IHsgdmlzdWFsaXplciB9IGZyb20gJ3JvbGx1cC1wbHVnaW4tdmlzdWFsaXplcidcblxuLy8gWW91IGNhbiBzZXQgZG5zLnNldERlZmF1bHRSZXN1bHRPcmRlcigndmVyYmF0aW0nKSB0byBkaXNhYmxlIHRoZSByZW9yZGVyaW5nIGJlaGF2aW9yLiBWaXRlIHdpbGwgdGhlbiBwcmludCB0aGUgYWRkcmVzcyBhcyBsb2NhbGhvc3Rcbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvc2VydmVyLW9wdGlvbnMuaHRtbCNzZXJ2ZXItaG9zdFxuZG5zLnNldERlZmF1bHRSZXN1bHRPcmRlcigndmVyYmF0aW0nKVxuXG4vLyBJbmNsdWRlIHRoZSByb2xsdXAtcGx1Z2luLXZpc3VhbGl6ZXIgaWYgdGhlIEJVSUxEX1ZJU1VBTElaRVIgZW52IHZhciBpcyBzZXQgdG8gXCJ0cnVlXCJcbmNvbnN0IGJ1aWxkVmlzdWFsaXplclBsdWdpbiA9IHByb2Nlc3MuZW52LkJVSUxEX1ZJU1VBTElaRVJcbiAgPyB2aXN1YWxpemVyKHtcbiAgICBmaWxlbmFtZTogcGF0aC5yZXNvbHZlKF9fZGlybmFtZSwgYHBhY2thZ2VzLyR7cHJvY2Vzcy5lbnYuQlVJTERfVklTVUFMSVpFUn0vYnVuZGxlLWFuYWx5emVyL3N0YXRzLXRyZWVtYXAuaHRtbGApLFxuICAgIHRlbXBsYXRlOiAndHJlZW1hcCcsIC8vIHN1bmJ1cnN0fHRyZWVtYXB8bmV0d29ya1xuICAgIHNvdXJjZW1hcDogdHJ1ZSxcbiAgICBnemlwU2l6ZTogdHJ1ZSxcbiAgfSlcbiAgOiB1bmRlZmluZWRcblxuLyoqXG4gKiBTYW5pdGl6ZSBwYWNrYWdlL2ZpbGVuYW1lIHRvIGV4Y2x1ZGUgdW5kZXNpcmVkIHN0cmluZ3NcbiAqIElNUE9SQU5UOiBJZiB0aGlzIGZ1bmN0aW9uIGlzIGNoYW5nZWQsIHlvdSAqKm11c3QqKiBjaGFuZ2UgdGhlIGZ1bmN0aW9uIGluIGAvcGFja2FnZXMvY29yZS9jbGkvc3JjL2NvcmUvcGFja2FnZS50c2AgYXMgd2VsbC5cbiAqIEBwYXJhbSB7c3RyaW5nfSBwYWNrYWdlTmFtZSBUaGUgc3RyaW5nIHRvIHNhbml0aXplXG4gKiBAcmV0dXJucyB7c3RyaW5nfSBUaGUgc2FuaXRpemVkIHBhY2thZ2UvZmlsZW5hbWUgc3RyaW5nXG4gKi9cbmV4cG9ydCBjb25zdCBzYW5pdGl6ZVBhY2thZ2VOYW1lID0gKHBhY2thZ2VOYW1lOiBzdHJpbmcpOiBzdHJpbmcgPT4ge1xuICAvLyBBZGQgYWRkaXRpb25hbCByZXBsYWNlIHJ1bGVzIGFzIG5lZWRlZFxuXG4gIC8vIFJlcGxhY2UgYW55IHZhcmlhdGlvbiBvZiBzdHJpbmcgJ0FuYWx5dGljcycgaW4gYXNzZXRzIGFuZCBjaHVua3MuIFRoZXNlIGFyZSBpbiBvcmRlciB0byBwcmVzZXJ2ZSBjYXBpdGFsaXphdGlvbi5cbiAgLy8gKFNvbWUgYWRibG9jayBmaWx0ZXIgbGlzdHMgZGVueSByZXF1ZXN0cyBmb3IgZmlsZXMgc3RhcnRpbmcgd2l0aCBcImFzc2V0cy9hbmFseXRpY3NcIi4gIFNlZSBNQS05MjYgZm9yIG1vcmUgY29udGV4dC4pXG4gIGNvbnN0IHNhbml0aXplZE5hbWUgPSAocGFja2FnZU5hbWUgfHwgJycpLnJlcGxhY2UoL0FuYWx5dGljcy9nLCAnVml0YWxzJykucmVwbGFjZSgvYW5hbHl0aWNzL2dpLCAndml0YWxzJylcblxuICByZXR1cm4gc2FuaXRpemVkTmFtZVxufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbXG4gICAgdnVlKCksXG4gICAgdnVlSnN4KCksXG4gICAgVnVlRGV2VG9vbHMoKSxcbiAgXSxcbiAgcmVzb2x2ZToge1xuICAgIC8vIFVzZSB0aGlzIG9wdGlvbiB0byBmb3JjZSBWaXRlIHRvIGFsd2F5cyByZXNvbHZlIGxpc3RlZCBkZXBlbmRlbmNpZXMgdG8gdGhlIHNhbWUgY29weSAoZnJvbSBwcm9qZWN0IHJvb3QpXG4gICAgZGVkdXBlOiBbJ3Z1ZScsICd2dWUtcm91dGVyJywgJ0Brb25nL2tvbmdwb25lbnRzJ10sXG4gICAgYWxpYXM6IHtcbiAgICAgICdAZW50aXRpZXMtc2hhcmVkLXNhbmRib3gnOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCAncGFja2FnZXMvZW50aXRpZXMvZW50aXRpZXMtc2hhcmVkL3NhbmRib3gvc2hhcmVkJyksXG4gICAgfSxcbiAgfSxcbiAgY3NzOiB7XG4gICAgcHJlcHJvY2Vzc29yT3B0aW9uczoge1xuICAgICAgc2Nzczoge1xuICAgICAgICBhcGk6ICdtb2Rlcm4nLFxuICAgICAgICAvLyBJbmplY3QgdGhlIEBrb25nL2Rlc2lnbi10b2tlbnMgU0NTUyB2YXJpYWJsZXMgdG8gbWFrZSB0aGVtIGF2YWlsYWJsZSBmb3IgYWxsIGNvbXBvbmVudHMuXG4gICAgICAgIGFkZGl0aW9uYWxEYXRhOiAnQHVzZSBcIkBrb25nL2Rlc2lnbi10b2tlbnMvdG9rZW5zL3Njc3MvdmFyaWFibGVzXCIgYXMgKjsnLFxuICAgICAgfSxcbiAgICB9LFxuICB9LFxuICBidWlsZDoge1xuICAgIG91dERpcjogJy4vZGlzdCcsXG4gICAgY3NzQ29kZVNwbGl0OiBmYWxzZSxcbiAgICBtaW5pZnk6IHRydWUsXG4gICAgc291cmNlbWFwOiAhIXByb2Nlc3MuZW52LkJVSUxEX1ZJU1VBTElaRVIsXG4gICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgLy8gTWFrZSBzdXJlIHRvIGV4dGVybmFsaXplIGRlcHMgdGhhdCBzaG91bGRuJ3QgYmUgYnVuZGxlZCBpbnRvIHlvdXIgbGlicmFyeVxuICAgICAgLy8gSWYgY29uZmlnLmJ1aWxkLnJvbGx1cE9wdGlvbnMuZXh0ZXJuYWwgaXMgYWxzbyBzZXQgYXQgdGhlIHBhY2thZ2UgbGV2ZWwsIHRoZSBhcnJheXMgd2lsbCBiZSBtZXJnZWRcbiAgICAgIGV4dGVybmFsOiBbXG4gICAgICAgICd2dWUnLFxuICAgICAgICAndnVlLXJvdXRlcicsXG4gICAgICAgICdAa29uZy9rb25ncG9uZW50cycsXG4gICAgICAgICdAa29uZy9pY29ucycsXG4gICAgICAgICdAa29uZy11aS1wdWJsaWMvaTE4bicsXG4gICAgICAgICdAa29uZy11aS1wdWJsaWMvZW50aXRpZXMtc2hhcmVkJyxcbiAgICAgICAgJ2F4aW9zJyxcbiAgICAgIF0sXG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgLy8gUHJvdmlkZSBnbG9iYWwgdmFyaWFibGVzIHRvIHVzZSBpbiB0aGUgVU1EIGJ1aWxkIGZvciBleHRlcm5hbGl6ZWQgZGVwc1xuICAgICAgICBnbG9iYWxzOiB7XG4gICAgICAgICAgdnVlOiAnVnVlJyxcbiAgICAgICAgICAndnVlLXJvdXRlcic6ICdWdWVSb3V0ZXInLFxuICAgICAgICAgICdAa29uZy11aS1wdWJsaWMvaTE4bic6ICdrb25nLXVpLXB1YmxpYy1pMThuJyxcbiAgICAgICAgICAnQGtvbmcva29uZ3BvbmVudHMnOiAnS29uZ3BvbmVudHMnLFxuICAgICAgICAgICdAa29uZy9pY29ucyc6ICdLb25nSWNvbnMnLFxuICAgICAgICAgICdAa29uZy11aS1wdWJsaWMvZW50aXRpZXMtc2hhcmVkJzogJ2tvbmctdWktcHVibGljLWVudGl0aWVzLXNoYXJlZCcsXG4gICAgICAgICAgYXhpb3M6ICdheGlvcycsXG4gICAgICAgIH0sXG4gICAgICAgIGV4cG9ydHM6ICduYW1lZCcsXG4gICAgICB9LFxuICAgICAgcGx1Z2luczogW1xuICAgICAgICAvLyB2aXN1YWxpemVyIG11c3QgcmVtYWluIGxhc3QgaW4gdGhlIGxpc3Qgb2YgcGx1Z2luc1xuICAgICAgICBidWlsZFZpc3VhbGl6ZXJQbHVnaW4sXG4gICAgICBdLFxuICAgIH0sXG4gIH0sXG4gIG9wdGltaXplRGVwczoge1xuICAgIGluY2x1ZGU6IFtcbiAgICAgICd2dWUnLFxuICAgICAgJ3Z1ZS1yb3V0ZXInLFxuICAgIF0sXG4gIH0sXG4gIC8vIENoYW5nZSB0aGUgcm9vdCB3aGVuIHV0aWxpemluZyB0aGUgc2FuZGJveCB2aWEgVVNFX1NBTkRCT1g9dHJ1ZSB0byB1c2UgdGhlIGAvc2FuZGJveC8qYCBmaWxlc1xuICAvLyBEdXJpbmcgdGhlIGJ1aWxkIHByb2Nlc3MsIHRoZSBgL3NhbmRib3gvKmAgZmlsZXMgYXJlIG5vdCB1c2VkIGFuZCB3ZSBzaG91bGQgZGVmYXVsdCB0byB0aGUgcGFja2FnZSByb290LlxuICByb290OiBwcm9jZXNzLmVudi5VU0VfU0FOREJPWCA/ICcuL3NhbmRib3gnIDogcHJvY2Vzcy5jd2QoKSxcbiAgLy8gU2V0cyB0aGUgVml0ZSBlbnZEaXIgdG8gcG9pbnQgdG8gdGhlIHJlcG9zaXRvcnkgcm9vdCBgLmVudi4qYCBmaWxlcy5cbiAgLy8gUGxlYXNlIGRvIE5PVCBhZGQgb3RoZXIgLmVudiBmaWxlcyBpbiBjaGlsZCBkaXJlY3Rvcmllcy5cbiAgZW52RGlyOiAnLi4vLi4vLi4vLi4vJyxcbiAgdGVzdDoge1xuICAgIGdsb2JhbHM6IHRydWUsXG4gICAgZW52aXJvbm1lbnQ6ICdqc2RvbScsXG4gICAgc2V0dXBGaWxlczogW10sXG4gICAgY292ZXJhZ2U6IHtcbiAgICAgIHJlcG9ydGVyOiBbJ3RleHQnLCAnanNvbicsICdodG1sJ10sXG4gICAgfSxcbiAgICBkZXBzOiB7XG4gICAgICBvcHRpbWl6ZXI6IHtcbiAgICAgICAgd2ViOiB7XG4gICAgICAgICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL3ZpdGVzdC1kZXYvdml0ZXN0L2lzc3Vlcy80MDc0XG4gICAgICAgICAgZXhjbHVkZTogWyd2dWUnXSxcbiAgICAgICAgfSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICBpbmNsdWRlOiBbJyoqL3NyYy8qKi8qLnNwZWMudHMnXSxcbiAgICBleGNsdWRlOiBbXG4gICAgICAnKiovZGlzdC8qKicsXG4gICAgICAnKiovX190ZW1wbGF0ZV9fLyoqJyxcbiAgICAgICcqKi9ub2RlX21vZHVsZXMvKionLFxuICAgICAgJ3BhY2thZ2VzL2NvcmUvY2xpLyoqJyxcbiAgICBdLFxuICB9LFxufSlcblxuLyoqXG4gKiBEZWZpbmUgdGhlIHNlcnZlci5wcm94eSBydWxlcyBmb3IgdmFyaW91cyBzaGFyZWQgQVBJc1xuICogVGhlc2UgdXRpbGl6ZSB0aGUgYFZJVEVfS09OTkVDVF9QQVRgIEtvbm5lY3QgUEFUIHRva2VuIGxvY2F0ZWQgaW4gYC8uZW52LmRldmVsb3BtZW50LmxvY2FsYFxuICogQHBhcmFtIHBhdGhUb1Jvb3QgVGhlIHBhdGggdG8gdGhlIHJlcG9zaXRvcnkgcm9vdCwgZnJvbSB0aGUgcGFja2FnZSBkaXJlY3RvcnksIHdoZXJlIHlvdXIgLmVudi5kZXZlbG9wbWVudC5sb2NhbCBmaWxlIGlzIGxvY2F0ZWQuIERlZmF1bHRzIHRvIGAuLi8uLi8uLi8uJyB3aGljaCB3b3JrcyBmb3IgbW9zdCBwYWNrYWdlcy5cbiAqIEByZXR1cm5zIE9iamVjdCBvZiBBUEkgcHJveGllcyB0byBwYXNzIHRvIHRoZSB2aXRlIGBjb25maWcuc2VydmVyLnByb3h5YFxuICovXG5leHBvcnQgY29uc3QgZ2V0QXBpUHJveGllcyA9IChwYXRoVG9Sb290OiBzdHJpbmcgPSAnLi4vLi4vLi4vLicpID0+IHtcbiAgLy8gSW1wb3J0IGVudiB2YXJpYWJsZXMgZnJvbSB0aGUgcm9vdFxuICAvLyBIYXJkLWNvZGVkIHRvICdkZXZlbG9wbWVudCcgc2luY2Ugd2UgYXJlIG9ubHkgdXNpbmcgdGhlIGVudiB2YXJpYWJsZXMgaW4gdGhlIGxvY2FsIGRldiBzZXJ2ZXJcbiAgY29uc3QgZW52ID0gbG9hZEVudignZGV2ZWxvcG1lbnQnLCBwYXRoVG9Sb290LCAnJylcblxuICBjb25zdCBrb25uZWN0QXV0aEhlYWRlciA9IGVudi5WSVRFX0tPTk5FQ1RfUEFUXG4gICAgPyB7XG4gICAgICBhdXRob3JpemF0aW9uOiBgQmVhcmVyICR7ZW52LlZJVEVfS09OTkVDVF9QQVR9YCxcbiAgICB9XG4gICAgOiB1bmRlZmluZWRcblxuICBjb25zdCBrb25nTWFuYWdlckF1dGhIZWFkZXIgPSBlbnYuVklURV9LT05HX01BTkFHRVJfVE9LRU5cbiAgICA/IHtcbiAgICAgICdrb25nLWFkbWluLXRva2VuJzogZW52LlZJVEVfS09OR19NQU5BR0VSX1RPS0VOLFxuICAgIH1cbiAgICA6IHVuZGVmaW5lZFxuXG4gIC8vIEFkZCBhZGRpdGlvbmFsIHJlZ2lvbnMgYXMgdGhleSBiZWNvbWUgYXZhaWxhYmxlXG4gIGNvbnN0IGF2YWlsYWJsZVJlZ2lvbnMgPSBbJ2F1JywgJ2V1JywgJ3VzJ11cbiAgY29uc3QgcmVnaW9uYWxQcm94aWVzID0ge31cbiAgLy8gQnVpbGQgdGhlIHJlZ2lvbmFsIEFQSSBwcm94aWVzXG4gIGZvciAoY29uc3QgcmVnaW9uIG9mIGF2YWlsYWJsZVJlZ2lvbnMpIHtcbiAgICAvLyBAdHMtaWdub3JlXG4gICAgcmVnaW9uYWxQcm94aWVzW2BeLyR7cmVnaW9ufS9rb25nLWFwaWBdID0ge1xuICAgICAgdGFyZ2V0OiAoZW52LlZJVEVfS09OTkVDVF9BUEkgPz8gJycpLnJlcGxhY2UoL1xce2dlb1xcfS8sIHJlZ2lvbiksXG4gICAgICByZXdyaXRlOiAocGF0aDogc3RyaW5nKSA9PiBwYXRoLnJlcGxhY2UoYC8ke3JlZ2lvbn0va29uZy1hcGlgLCAnJyksXG4gICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgICBoZWFkZXJzOiB7XG4gICAgICAgIC4uLmtvbm5lY3RBdXRoSGVhZGVyLFxuICAgICAgfSxcbiAgICB9XG4gIH1cblxuICByZXR1cm4ge1xuICAgIC8vIEFkZCBLb25uZWN0IEFQSSBwcm94aWVzXG4gICAgLi4ucmVnaW9uYWxQcm94aWVzLFxuXG4gICAgLyoqXG4gICAgICogL2tvbmctdWkvY29uZmlnIEpTT05cbiAgICAgKi9cbiAgICAnXi9rb25nLXVpL2NvbmZpZyc6IHtcbiAgICAgIHRhcmdldDogZW52LlZJVEVfS09OTkVDVF9DT05GSUcsXG4gICAgICBjaGFuZ2VPcmlnaW46IHRydWUsXG4gICAgfSxcblxuICAgIC8vIEtBdXRoIHYxIEFQSXNcbiAgICAnXi9rYXV0aCc6IHtcbiAgICAgIHRhcmdldDogZW52LlZJVEVfS09OTkVDVF9LQVVUSCxcbiAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgLi4ua29ubmVjdEF1dGhIZWFkZXIsXG4gICAgICB9LFxuICAgIH0sXG5cbiAgICAvLyBHbG9iYWwgdjIgQVBJc1xuICAgICdeL2tvbmctYXBpL3YyJzoge1xuICAgICAgdGFyZ2V0OiBlbnYuVklURV9LT05ORUNUX0dMT0JBTCxcbiAgICAgIHJld3JpdGU6IChwYXRoOiBzdHJpbmcpID0+IHBhdGgucmVwbGFjZSgnL2tvbmctYXBpJywgJycpLFxuICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAuLi5rb25uZWN0QXV0aEhlYWRlcixcbiAgICAgIH0sXG4gICAgfSxcblxuICAgIC8qKlxuICAgICAqIEtPTkcgTUFOQUdFUiBQUk9YSUVTXG4gICAgICovXG4gICAgJ14va29uZy1tYW5hZ2VyJzoge1xuICAgICAgdGFyZ2V0OiBlbnYuVklURV9LT05HX01BTkFHRVJfQVBJLFxuICAgICAgcmV3cml0ZTogKHBhdGg6IHN0cmluZykgPT4gcGF0aC5yZXBsYWNlKCcva29uZy1tYW5hZ2VyJywgJycpLFxuICAgICAgY2hhbmdlT3JpZ2luOiB0cnVlLFxuICAgICAgaGVhZGVyczoge1xuICAgICAgICAuLi5rb25nTWFuYWdlckF1dGhIZWFkZXIsXG4gICAgICB9LFxuICAgIH0sXG4gIH1cbn1cbiIsICJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiL1VzZXJzL3lpbGluZy5ndUBrb25naHEuY29tL0RldmVsb3Blci9Lb25nL3B1YmxpYy11aS1jb21wb25lbnRzL3BhY2thZ2VzL2VudGl0aWVzL2VudGl0aWVzLWdhdGV3YXktc2VydmljZXNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIi9Vc2Vycy95aWxpbmcuZ3VAa29uZ2hxLmNvbS9EZXZlbG9wZXIvS29uZy9wdWJsaWMtdWktY29tcG9uZW50cy9wYWNrYWdlcy9lbnRpdGllcy9lbnRpdGllcy1nYXRld2F5LXNlcnZpY2VzL3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9Vc2Vycy95aWxpbmcuZ3VAa29uZ2hxLmNvbS9EZXZlbG9wZXIvS29uZy9wdWJsaWMtdWktY29tcG9uZW50cy9wYWNrYWdlcy9lbnRpdGllcy9lbnRpdGllcy1nYXRld2F5LXNlcnZpY2VzL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHNoYXJlZFZpdGVDb25maWcsIHsgZ2V0QXBpUHJveGllcywgc2FuaXRpemVQYWNrYWdlTmFtZSB9IGZyb20gJy4uLy4uLy4uL3ZpdGUuY29uZmlnLnNoYXJlZCdcbmltcG9ydCB7IGRlZmluZUNvbmZpZywgbWVyZ2VDb25maWcgfSBmcm9tICd2aXRlJ1xuaW1wb3J0IHsgcmVzb2x2ZSB9IGZyb20gJ3BhdGgnXG5cbi8vIFBhY2thZ2UgbmFtZSBNVVNUIGFsd2F5cyBtYXRjaCB0aGUga2ViYWItY2FzZSBwYWNrYWdlIG5hbWUgaW5zaWRlIHRoZSBjb21wb25lbnQncyBwYWNrYWdlLmpzb24gZmlsZSBhbmQgdGhlIG5hbWUgb2YgeW91ciBgL3BhY2thZ2VzL3twYWNrYWdlLW5hbWV9YCBkaXJlY3RvcnlcbmNvbnN0IHBhY2thZ2VOYW1lID0gJ2VudGl0aWVzLWdhdGV3YXktc2VydmljZXMnXG5jb25zdCBzYW5pdGl6ZWRQYWNrYWdlTmFtZSA9IHNhbml0aXplUGFja2FnZU5hbWUocGFja2FnZU5hbWUpXG5cbi8vIE1lcmdlIHRoZSBzaGFyZWQgVml0ZSBjb25maWcgd2l0aCB0aGUgbG9jYWwgb25lIGRlZmluZWQgYmVsb3dcbmNvbnN0IGNvbmZpZyA9IG1lcmdlQ29uZmlnKHNoYXJlZFZpdGVDb25maWcsIGRlZmluZUNvbmZpZyh7XG4gIGJ1aWxkOiB7XG4gICAgbGliOiB7XG4gICAgICAvLyBUaGUga2ViYWItY2FzZSBuYW1lIG9mIHRoZSBleHBvc2VkIGdsb2JhbCB2YXJpYWJsZS4gTVVTVCBiZSBpbiB0aGUgZm9ybWF0IGBrb25nLXVpLXB1YmxpYy17cGFja2FnZS1uYW1lfWBcbiAgICAgIC8vIEV4YW1wbGU6IG5hbWU6ICdrb25nLXVpLXB1YmxpYy1kZW1vLWNvbXBvbmVudCdcbiAgICAgIG5hbWU6IGBrb25nLXVpLXB1YmxpYy0ke3Nhbml0aXplZFBhY2thZ2VOYW1lfWAsXG4gICAgICBlbnRyeTogcmVzb2x2ZShfX2Rpcm5hbWUsICcuL3NyYy9pbmRleC50cycpLFxuICAgICAgZmlsZU5hbWU6IChmb3JtYXQpID0+IGAke3Nhbml0aXplZFBhY2thZ2VOYW1lfS4ke2Zvcm1hdH0uanNgLFxuICAgIH0sXG4gIH0sXG4gIHNlcnZlcjoge1xuICAgIHByb3h5OiB7XG4gICAgICAvLyBBZGQgdGhlIEFQSSBwcm94aWVzIHRvIGluamVjdCB0aGUgQXV0aG9yaXphdGlvbiBoZWFkZXJcbiAgICAgIC4uLmdldEFwaVByb3hpZXMoKSxcbiAgICB9LFxuICB9LFxufSkpXG5cbi8vIElmIHdlIGFyZSB0cnlpbmcgdG8gcHJldmlldyBhIGJ1aWxkIG9mIHRoZSBsb2NhbCBgcGFja2FnZS9lbnRpdGllcy1nYXRld2F5LXNlcnZpY2VzL3NhbmRib3hgIGRpcmVjdG9yeSxcbi8vIHVuc2V0IHRoZSBsaWIsIHJvbGx1cE9wdGlvbnMuZXh0ZXJuYWwgYW5kIHJvbGx1cE9wdGlvbnMub3V0cHV0Lmdsb2JhbHMgcHJvcGVydGllc1xuaWYgKHByb2Nlc3MuZW52LlVTRV9TQU5EQk9YKSB7XG4gIGNvbmZpZy5idWlsZC5saWIgPSB1bmRlZmluZWRcbiAgY29uZmlnLmJ1aWxkLnJvbGx1cE9wdGlvbnMuZXh0ZXJuYWwgPSB1bmRlZmluZWRcbiAgY29uZmlnLmJ1aWxkLnJvbGx1cE9wdGlvbnMub3V0cHV0Lmdsb2JhbCA9IHVuZGVmaW5lZFxufVxuXG5leHBvcnQgZGVmYXVsdCBjb25maWdcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFLQSxTQUFTLGNBQWMsZUFBZTtBQUN0QyxPQUFPLFNBQVM7QUFDaEIsT0FBTyxZQUFZO0FBQ25CLE9BQU8saUJBQWlCO0FBQ3hCLE9BQU8sU0FBUztBQUNoQixPQUFPLFVBQVU7QUFDakIsU0FBUyxrQkFBa0I7QUFYM0IsSUFBTSxtQ0FBbUM7QUFlekMsSUFBSSxzQkFB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QUFGeEIsSUFBTUMsb0NBQW1DO0FBS3pDLElBQU0sY0FBYztBQUNwQixJQUFNLHVCQUF1QixvQkFBb0IsV0FBVztBQUc1RCxJQUFNLFNBQVMsWUFBWSw0QkFBa0JDLGNBQWE7QUFBQSxFQUN4RCxPQUFPO0FBQUEsSUFDTCxLQUFLO0FBQUE7QUFBQTtBQUFBLE1BR0gsTUFBTSxrQkFBa0Isb0JBQW9CO0FBQUEsTUFDNUMsT0FBTyxRQUFRQyxtQ0FBVyxnQkFBZ0I7QUFBQSxNQUMxQyxVQUFVLENBQUMsV0FBVyxHQUFHLG9CQUFvQixJQUFJLE1BQU07QUFBQSxJQUN6RDtBQUFBLEVBQ0Y7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQTtBQUFBLE1BRUwsR0FBRyxjQUFjO0FBQUEsSUFDbkI7QUFBQSxFQUNGO0FBQ0YsQ0FBQyxDQUFDO0FBSUYsSUFBSSxRQUFRLElBQUksYUFBYTtBQUMzQixTQUFPLE1BQU0sTUFBTTtBQUNuQixTQUFPLE1BQU0sY0FBYyxXQUFXO0FBQ3RDLFNBQU8sTUFBTSxjQUFjLE9BQU8sU0FBUztBQUM3QztBQUVBLElBQU8sc0JBQVE7IiwKICAibmFtZXMiOiBbInBhY2thZ2VOYW1lIiwgInBhdGgiLCAiZGVmaW5lQ29uZmlnIiwgIl9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lIiwgImRlZmluZUNvbmZpZyIsICJfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSJdCn0K
