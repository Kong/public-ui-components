# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [0.5.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.4.6...@kong-ui-public/analytics-config-store@0.5.0) (2024-05-20)


### Features

* **analytics:** analytics bridge for Portal [MA-2737] ([#1344](https://github.com/Kong/public-ui-components/issues/1344)) ([be18d27](https://github.com/Kong/public-ui-components/commit/be18d2790de2c803f15b3865557ff71693b1f195))





## [0.4.6](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.4.5...@kong-ui-public/analytics-config-store@0.4.6) (2024-05-16)

**Note:** Version bump only for package @kong-ui-public/analytics-config-store





## [0.4.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.4.4...@kong-ui-public/analytics-config-store@0.4.5) (2024-05-15)

**Note:** Version bump only for package @kong-ui-public/analytics-config-store





## [0.4.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.4.3...@kong-ui-public/analytics-config-store@0.4.4) (2024-05-13)

**Note:** Version bump only for package @kong-ui-public/analytics-config-store





## [0.4.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.4.2...@kong-ui-public/analytics-config-store@0.4.3) (2024-05-13)

**Note:** Version bump only for package @kong-ui-public/analytics-config-store





## [0.4.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.4.1...@kong-ui-public/analytics-config-store@0.4.2) (2024-04-18)

**Note:** Version bump only for package @kong-ui-public/analytics-config-store





## [0.4.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.4.0...@kong-ui-public/analytics-config-store@0.4.1) (2024-04-17)

**Note:** Version bump only for package @kong-ui-public/analytics-config-store





# [0.4.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.3.6...@kong-ui-public/analytics-config-store@0.4.0) (2024-04-15)


### Features

* **analytics:** improved dashboard time spec handling [MA-2759] ([#1330](https://github.com/Kong/public-ui-components/issues/1330)) ([123fbc0](https://github.com/Kong/public-ui-components/commit/123fbc077659e0f74589dfda3b3b1efcff13cdf5))


### BREAKING CHANGES

* **analytics:** refactor interface for analytics config store

- Change analytics config store to fetch config when first instantiated
  and expose refs rather than functions.
- Update dashboard renderer to fill in a default time spec based on the
  org's retention if one isn't provided.
- Don't issue queries until a time spec is determined.
- Fix missing feature flag functions in tests.
- Fix display of "description" property in metric cards: show in container
  rather than broadcasting to all cards.
- Fix title and description reactivity in metrics provider.
- Replace special timeframe token in tile descriptions.
- Fill in missing context values in the top-level renderer to save code
  in the tile renderers.





## [0.3.6](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.3.5...@kong-ui-public/analytics-config-store@0.3.6) (2024-04-10)

**Note:** Version bump only for package @kong-ui-public/analytics-config-store





## [0.3.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.3.4...@kong-ui-public/analytics-config-store@0.3.5) (2024-04-06)

**Note:** Version bump only for package @kong-ui-public/analytics-config-store





## [0.3.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.3.3...@kong-ui-public/analytics-config-store@0.3.4) (2024-04-06)

**Note:** Version bump only for package @kong-ui-public/analytics-config-store





## [0.3.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.3.2...@kong-ui-public/analytics-config-store@0.3.3) (2024-04-04)

**Note:** Version bump only for package @kong-ui-public/analytics-config-store





## [0.3.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.3.1...@kong-ui-public/analytics-config-store@0.3.2) (2024-03-21)

**Note:** Version bump only for package @kong-ui-public/analytics-config-store





## [0.3.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.3.0...@kong-ui-public/analytics-config-store@0.3.1) (2024-03-20)

**Note:** Version bump only for package @kong-ui-public/analytics-config-store





# [0.3.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.2.0...@kong-ui-public/analytics-config-store@0.3.0) (2024-03-19)


### Features

* **analytics:** move to v2 config endpoint [MA-2730] ([#1257](https://github.com/Kong/public-ui-components/issues/1257)) ([e61e42f](https://github.com/Kong/public-ui-components/commit/e61e42fddb221a8e04f7faa18aa965bf7584d0e3))


### BREAKING CHANGES

* **analytics:** new config endpoint; types updated

The following components are updated:

- AnalyticsConfigCheck, and the associated store
- MetricsProvider
- AnalyticsBridge (updates type that implementations must adhere to)
- DashboardRenderer (sandbox and tests)





# [0.2.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.1.2...@kong-ui-public/analytics-config-store@0.2.0) (2024-03-14)


### Features

* **analytics:** add `AnalyticsConfigCheck` component [MA-2715] ([#1237](https://github.com/Kong/public-ui-components/issues/1237)) ([e6ec171](https://github.com/Kong/public-ui-components/commit/e6ec1717e34a1d8ba994bf9dc4948cdef21776f2))





## [0.1.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.1.1...@kong-ui-public/analytics-config-store@0.1.2) (2024-03-13)

**Note:** Version bump only for package @kong-ui-public/analytics-config-store





## [0.1.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-config-store@0.1.0...@kong-ui-public/analytics-config-store@0.1.1) (2024-03-12)

**Note:** Version bump only for package @kong-ui-public/analytics-config-store





# 0.1.0 (2024-03-07)


### Features

* **analytics:** get config from analytics endpoint [MA-2532] ([#1208](https://github.com/Kong/public-ui-components/issues/1208)) ([3a1ae09](https://github.com/Kong/public-ui-components/commit/3a1ae09827dd5797d4fd5e93fe60935758c1c6bc))
