# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.23.17](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.16...@kong-ui-public/dashboard-renderer@0.23.17) (2024-07-12)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.23.16](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.15...@kong-ui-public/dashboard-renderer@0.23.16) (2024-07-11)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.23.15](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.14...@kong-ui-public/dashboard-renderer@0.23.15) (2024-07-10)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.23.14](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.13...@kong-ui-public/dashboard-renderer@0.23.14) (2024-07-10)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.23.13](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.12...@kong-ui-public/dashboard-renderer@0.23.13) (2024-07-09)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.23.12](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.11...@kong-ui-public/dashboard-renderer@0.23.12) (2024-07-09)


### Bug Fixes

* **deps:** update all [@kong](https://github.com/kong) scoped dependencies ([#1478](https://github.com/Kong/public-ui-components/issues/1478)) ([47cd468](https://github.com/Kong/public-ui-components/commit/47cd4680b8ed1fb686270df19853288de19c3106))





## [0.23.11](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.10...@kong-ui-public/dashboard-renderer@0.23.11) (2024-07-08)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.23.10](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.9...@kong-ui-public/dashboard-renderer@0.23.10) (2024-07-04)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.23.9](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.8...@kong-ui-public/dashboard-renderer@0.23.9) (2024-07-03)


### Bug Fixes

* **dashboard-renderer:** resize observer callback [KHCP-12507] ([#1474](https://github.com/Kong/public-ui-components/issues/1474)) ([e6f7cf3](https://github.com/Kong/public-ui-components/commit/e6f7cf3b12ad2a2df87eda87ad05dc8f61e4143d))





## [0.23.8](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.7...@kong-ui-public/dashboard-renderer@0.23.8) (2024-07-02)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.23.7](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.6...@kong-ui-public/dashboard-renderer@0.23.7) (2024-06-26)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.23.6](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.5...@kong-ui-public/dashboard-renderer@0.23.6) (2024-06-24)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.23.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.4...@kong-ui-public/dashboard-renderer@0.23.5) (2024-06-24)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.23.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.3...@kong-ui-public/dashboard-renderer@0.23.4) (2024-06-21)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.23.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.2...@kong-ui-public/dashboard-renderer@0.23.3) (2024-06-20)


### Bug Fixes

* pre-release @kong/kongponents adoption ([#1456](https://github.com/Kong/public-ui-components/issues/1456)) ([47a18aa](https://github.com/Kong/public-ui-components/commit/47a18aa2cc817e2a7379cbbe18a166e22a2c802f))





## [0.23.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.1...@kong-ui-public/dashboard-renderer@0.23.2) (2024-06-14)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.23.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.23.0...@kong-ui-public/dashboard-renderer@0.23.1) (2024-06-14)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





# [0.23.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.22.7...@kong-ui-public/dashboard-renderer@0.23.0) (2024-06-13)


### Features

* **analytics:** add support for basic datasource [MA-2931, MA-2923] ([#1450](https://github.com/Kong/public-ui-components/issues/1450)) ([6b5e367](https://github.com/Kong/public-ui-components/commit/6b5e367d0bf7f2f4c12117e30280ffcf819bfd68))


### BREAKING CHANGES

* **analytics:** change signature of `queryFn` in query bridge

- Change signature of `queryFn`.
- Update default queried time range to 7 days for everyone behind a feature flag.
- Stop relying on trend access determination in metric cards.
- Add `datasource` parameter to MetricsProvider.
- Add `datasource` property to dashboard query definitions.
- Determine a default `datasource` based on feature flag.





## [0.22.7](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.22.6...@kong-ui-public/dashboard-renderer@0.22.7) (2024-06-12)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.22.6](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.22.5...@kong-ui-public/dashboard-renderer@0.22.6) (2024-06-11)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.22.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.22.4...@kong-ui-public/dashboard-renderer@0.22.5) (2024-06-10)


### Bug Fixes

* kongponents alpha phase 15 [KHCP-12191] ([#1431](https://github.com/Kong/public-ui-components/issues/1431)) ([473e8b0](https://github.com/Kong/public-ui-components/commit/473e8b097f854feb37871432f5fd3c1bccffde16))





## [0.22.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.22.3...@kong-ui-public/dashboard-renderer@0.22.4) (2024-06-10)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.22.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.22.2...@kong-ui-public/dashboard-renderer@0.22.3) (2024-06-10)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.22.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.22.1...@kong-ui-public/dashboard-renderer@0.22.2) (2024-06-07)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.22.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.22.0...@kong-ui-public/dashboard-renderer@0.22.1) (2024-06-07)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





# [0.22.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.28...@kong-ui-public/dashboard-renderer@0.22.0) (2024-06-06)


### Features

* **eslint:** eslint v9 and shared configs [KHCP-11627] ([#1435](https://github.com/Kong/public-ui-components/issues/1435)) ([d0a973f](https://github.com/Kong/public-ui-components/commit/d0a973ff61b5302ee2b1cd3d73b0deb0c5864fa5))





## [0.21.28](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.27...@kong-ui-public/dashboard-renderer@0.21.28) (2024-06-03)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.27](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.26...@kong-ui-public/dashboard-renderer@0.21.27) (2024-05-27)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.26](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.25...@kong-ui-public/dashboard-renderer@0.21.26) (2024-05-22)


### Bug Fixes

* kongponents alpha phase 14 [KHCP-11982] ([#1420](https://github.com/Kong/public-ui-components/issues/1420)) ([fd5a9d0](https://github.com/Kong/public-ui-components/commit/fd5a9d0ff5079f0a5d969f74bea13dcdbacca22f))





## [0.21.25](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.24...@kong-ui-public/dashboard-renderer@0.21.25) (2024-05-22)


### Bug Fixes

* **entitybasetable:** ktable props and events [KHCP-11890] ([#1412](https://github.com/Kong/public-ui-components/issues/1412)) ([de27221](https://github.com/Kong/public-ui-components/commit/de27221f806967bec3e04f7f87cd5b6ea9b44593))





## [0.21.24](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.23...@kong-ui-public/dashboard-renderer@0.21.24) (2024-05-21)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.23](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.22...@kong-ui-public/dashboard-renderer@0.21.23) (2024-05-20)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.22](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.21...@kong-ui-public/dashboard-renderer@0.21.22) (2024-05-16)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.21](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.20...@kong-ui-public/dashboard-renderer@0.21.21) (2024-05-16)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.20](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.19...@kong-ui-public/dashboard-renderer@0.21.20) (2024-05-16)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.19](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.18...@kong-ui-public/dashboard-renderer@0.21.19) (2024-05-16)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.18](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.17...@kong-ui-public/dashboard-renderer@0.21.18) (2024-05-15)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.17](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.16...@kong-ui-public/dashboard-renderer@0.21.17) (2024-05-15)


### Bug Fixes

* kongponents alpha phase 13 [KHCP-11882] ([#1406](https://github.com/Kong/public-ui-components/issues/1406)) ([f438c67](https://github.com/Kong/public-ui-components/commit/f438c67a6c45bfbf0197df68af83782219c615ad))





## [0.21.16](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.15...@kong-ui-public/dashboard-renderer@0.21.16) (2024-05-13)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.15](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.14...@kong-ui-public/dashboard-renderer@0.21.15) (2024-05-13)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.14](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.13...@kong-ui-public/dashboard-renderer@0.21.14) (2024-05-13)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.13](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.12...@kong-ui-public/dashboard-renderer@0.21.13) (2024-05-10)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.12](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.11...@kong-ui-public/dashboard-renderer@0.21.12) (2024-05-09)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.11](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.10...@kong-ui-public/dashboard-renderer@0.21.11) (2024-05-09)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.10](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.9...@kong-ui-public/dashboard-renderer@0.21.10) (2024-05-09)


### Bug Fixes

* kongponents alpha phase 12 [KHCP-11651] ([#1371](https://github.com/Kong/public-ui-components/issues/1371)) ([6241fe5](https://github.com/Kong/public-ui-components/commit/6241fe51d8f08d4fc7d4e58eb6b02a0a0b100d81))





## [0.21.9](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.8...@kong-ui-public/dashboard-renderer@0.21.9) (2024-05-06)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.8](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.7...@kong-ui-public/dashboard-renderer@0.21.8) (2024-05-06)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.7](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.6...@kong-ui-public/dashboard-renderer@0.21.7) (2024-05-03)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.6](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.5...@kong-ui-public/dashboard-renderer@0.21.6) (2024-04-25)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.4...@kong-ui-public/dashboard-renderer@0.21.5) (2024-04-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.3...@kong-ui-public/dashboard-renderer@0.21.4) (2024-04-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.2...@kong-ui-public/dashboard-renderer@0.21.3) (2024-04-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.1...@kong-ui-public/dashboard-renderer@0.21.2) (2024-04-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.21.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.21.0...@kong-ui-public/dashboard-renderer@0.21.1) (2024-04-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





# [0.21.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.20.5...@kong-ui-public/dashboard-renderer@0.21.0) (2024-04-18)


### Features

* **analytics-utilities:** use new granularity values [MA-2847] ([#1346](https://github.com/Kong/public-ui-components/issues/1346)) ([a15e223](https://github.com/Kong/public-ui-components/commit/a15e2235903231968062122454b2f9c731971946))


### BREAKING CHANGES

* **analytics-utilities:** granularity values have changed





## [0.20.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.20.4...@kong-ui-public/dashboard-renderer@0.20.5) (2024-04-18)


### Bug Fixes

* kongponents alpha phase 11 [KHCP-11527] ([#1333](https://github.com/Kong/public-ui-components/issues/1333)) ([b8d2901](https://github.com/Kong/public-ui-components/commit/b8d29015bc263a9835158d8b729293afc758fdc2))





## [0.20.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.20.3...@kong-ui-public/dashboard-renderer@0.20.4) (2024-04-18)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.20.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.20.2...@kong-ui-public/dashboard-renderer@0.20.3) (2024-04-17)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.20.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.20.1...@kong-ui-public/dashboard-renderer@0.20.2) (2024-04-17)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.20.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.20.0...@kong-ui-public/dashboard-renderer@0.20.1) (2024-04-16)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





# [0.20.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.19.1...@kong-ui-public/dashboard-renderer@0.20.0) (2024-04-15)


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





## [0.19.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.19.0...@kong-ui-public/dashboard-renderer@0.19.1) (2024-04-12)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





# [0.19.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.18.9...@kong-ui-public/dashboard-renderer@0.19.0) (2024-04-10)


### Features

* **analytics:** allow checking feature flags in bridge ([#1317](https://github.com/Kong/public-ui-components/issues/1317)) ([73b27c6](https://github.com/Kong/public-ui-components/commit/73b27c624244ced7f2ba84f56b04ec965675d425))





## [0.18.9](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.18.8...@kong-ui-public/dashboard-renderer@0.18.9) (2024-04-09)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.18.8](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.18.7...@kong-ui-public/dashboard-renderer@0.18.8) (2024-04-06)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.18.7](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.18.6...@kong-ui-public/dashboard-renderer@0.18.7) (2024-04-06)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.18.6](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.18.5...@kong-ui-public/dashboard-renderer@0.18.6) (2024-04-04)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.18.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.18.4...@kong-ui-public/dashboard-renderer@0.18.5) (2024-04-04)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.18.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.18.3...@kong-ui-public/dashboard-renderer@0.18.4) (2024-04-03)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.18.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.18.2...@kong-ui-public/dashboard-renderer@0.18.3) (2024-04-02)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.18.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.18.1...@kong-ui-public/dashboard-renderer@0.18.2) (2024-04-02)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.18.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.18.0...@kong-ui-public/dashboard-renderer@0.18.1) (2024-04-01)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





# [0.18.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.17.4...@kong-ui-public/dashboard-renderer@0.18.0) (2024-03-28)


### Features

* **metric-card-container:** add optional title [MA-2726] ([#1298](https://github.com/Kong/public-ui-components/issues/1298)) ([cbee003](https://github.com/Kong/public-ui-components/commit/cbee003c22262268f69da2529829cbe2347a075f))





## [0.17.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.17.3...@kong-ui-public/dashboard-renderer@0.17.4) (2024-03-28)


### Bug Fixes

* **entities-consumers:** group form fields [KHCP-11029] ([#1300](https://github.com/Kong/public-ui-components/issues/1300)) ([c9375c0](https://github.com/Kong/public-ui-components/commit/c9375c07c0b7a6f09fe714f64ed48eac0ea187dd))





## [0.17.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.17.2...@kong-ui-public/dashboard-renderer@0.17.3) (2024-03-27)


### Bug Fixes

* kongponents alpha phase 10 [KHCP-11172] ([#1292](https://github.com/Kong/public-ui-components/issues/1292)) ([47f01aa](https://github.com/Kong/public-ui-components/commit/47f01aa1ec4c57a48bc046987bed9482b7c832a2))





## [0.17.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.17.1...@kong-ui-public/dashboard-renderer@0.17.2) (2024-03-26)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.17.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.17.0...@kong-ui-public/dashboard-renderer@0.17.1) (2024-03-25)


### Bug Fixes

* **entities-plugins, vfg:** create plugin form a11y improvements [KHCP-11026] ([#1272](https://github.com/Kong/public-ui-components/issues/1272)) ([b1ed04e](https://github.com/Kong/public-ui-components/commit/b1ed04eb56ff2869b988a217220debc78655f3f0))





# [0.17.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.16.1...@kong-ui-public/dashboard-renderer@0.17.0) (2024-03-22)


### Features

* **dashboard:** allow rows to fit content [MA-2744] ([#1284](https://github.com/Kong/public-ui-components/issues/1284)) ([5fca230](https://github.com/Kong/public-ui-components/commit/5fca230ab61736e964d92272fbcbffd06c0b7e82))





## [0.16.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.16.0...@kong-ui-public/dashboard-renderer@0.16.1) (2024-03-22)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





# [0.16.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.15.4...@kong-ui-public/dashboard-renderer@0.16.0) (2024-03-21)


### Bug Fixes

* **analytics-chart:** remove fill prop [MA-2659] ([#1280](https://github.com/Kong/public-ui-components/issues/1280)) ([b24f07d](https://github.com/Kong/public-ui-components/commit/b24f07d6e230116c619e690b35d030cfbfb37bd9))


### BREAKING CHANGES

* **analytics-chart:** removed the fill prop from chart options

* fix: no need to pass fill to chart options anymore in dashboard renderer





## [0.15.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.15.3...@kong-ui-public/dashboard-renderer@0.15.4) (2024-03-21)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.15.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.15.2...@kong-ui-public/dashboard-renderer@0.15.3) (2024-03-21)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.15.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.15.1...@kong-ui-public/dashboard-renderer@0.15.2) (2024-03-21)


### Bug Fixes

* **dashboard-renderer:** golden signals renderer refresh interval ([#1276](https://github.com/Kong/public-ui-components/issues/1276)) ([08532d4](https://github.com/Kong/public-ui-components/commit/08532d442132083cad8fa497188d4a27923a9ca8))





## [0.15.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.15.0...@kong-ui-public/dashboard-renderer@0.15.1) (2024-03-21)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





# [0.15.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.14.6...@kong-ui-public/dashboard-renderer@0.15.0) (2024-03-20)


### Features

* allow dashbaord renderer to optionally auto refresh queries ([#1271](https://github.com/Kong/public-ui-components/issues/1271)) ([eee8e28](https://github.com/Kong/public-ui-components/commit/eee8e28d0333935782b2570be27881be6beced01))





## [0.14.6](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.14.5...@kong-ui-public/dashboard-renderer@0.14.6) (2024-03-20)


### Bug Fixes

* proper heading element in widgets [KHCP-11027] ([#1252](https://github.com/Kong/public-ui-components/issues/1252)) ([b66ce71](https://github.com/Kong/public-ui-components/commit/b66ce711fa876bb75bb880eece8514a8055034be))





## [0.14.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.14.4...@kong-ui-public/dashboard-renderer@0.14.5) (2024-03-20)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.14.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.14.3...@kong-ui-public/dashboard-renderer@0.14.4) (2024-03-20)


### Bug Fixes

* **dashboard-tile:** needed Entity Link css ([#1267](https://github.com/Kong/public-ui-components/issues/1267)) ([4cd2f25](https://github.com/Kong/public-ui-components/commit/4cd2f258e5f98ff48735cf5e8934b97af0d15c87))





## [0.14.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.14.2...@kong-ui-public/dashboard-renderer@0.14.3) (2024-03-19)


### Bug Fixes

* update dashboard-renderer docs ([#1265](https://github.com/Kong/public-ui-components/issues/1265)) ([4116b88](https://github.com/Kong/public-ui-components/commit/4116b887eac8120ab5a0660a637fefd8119c2f97))





## [0.14.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.14.1...@kong-ui-public/dashboard-renderer@0.14.2) (2024-03-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.14.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.14.0...@kong-ui-public/dashboard-renderer@0.14.1) (2024-03-19)


### Bug Fixes

* remove unnecessary class ([#1264](https://github.com/Kong/public-ui-components/issues/1264)) ([449dd70](https://github.com/Kong/public-ui-components/commit/449dd705db7013c4316061cc6b27aa85cb9c7046))





# [0.14.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.13.3...@kong-ui-public/dashboard-renderer@0.14.0) (2024-03-19)


### Features

* **analytics:** move to v2 config endpoint [MA-2730] ([#1257](https://github.com/Kong/public-ui-components/issues/1257)) ([e61e42f](https://github.com/Kong/public-ui-components/commit/e61e42fddb221a8e04f7faa18aa965bf7584d0e3))


### BREAKING CHANGES

* **analytics:** new config endpoint; types updated

The following components are updated:

- AnalyticsConfigCheck, and the associated store
- MetricsProvider
- AnalyticsBridge (updates type that implementations must adhere to)
- DashboardRenderer (sandbox and tests)





## [0.13.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.13.2...@kong-ui-public/dashboard-renderer@0.13.3) (2024-03-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.13.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.13.1...@kong-ui-public/dashboard-renderer@0.13.2) (2024-03-18)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.13.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.13.0...@kong-ui-public/dashboard-renderer@0.13.1) (2024-03-18)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





# [0.13.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.12.0...@kong-ui-public/dashboard-renderer@0.13.0) (2024-03-18)


### Features

* **dashboard-renderer:** pass through allowCsvExport to charts in dashboard ([#1260](https://github.com/Kong/public-ui-components/issues/1260)) ([1ffe761](https://github.com/Kong/public-ui-components/commit/1ffe761c756d7b11c81bc723c6a8b3db30c80553))





# [0.12.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.11.1...@kong-ui-public/dashboard-renderer@0.12.0) (2024-03-15)


### Features

* **dashboard-renderer:** entity links in TopN table ([#1247](https://github.com/Kong/public-ui-components/issues/1247)) ([daa48df](https://github.com/Kong/public-ui-components/commit/daa48df29e75d4eee08c2389c0894773e95083af))





## [0.11.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.11.0...@kong-ui-public/dashboard-renderer@0.11.1) (2024-03-14)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





# [0.11.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.10.8...@kong-ui-public/dashboard-renderer@0.11.0) (2024-03-14)


### Features

* use css grid instead for grid layout ([#1238](https://github.com/Kong/public-ui-components/issues/1238)) ([a747ed3](https://github.com/Kong/public-ui-components/commit/a747ed3d73997d7a2d927787c413767a1daa9162))





## [0.10.8](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.10.7...@kong-ui-public/dashboard-renderer@0.10.8) (2024-03-13)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.10.7](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.10.6...@kong-ui-public/dashboard-renderer@0.10.7) (2024-03-13)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.10.6](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.10.5...@kong-ui-public/dashboard-renderer@0.10.6) (2024-03-13)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.10.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.10.4...@kong-ui-public/dashboard-renderer@0.10.5) (2024-03-12)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.10.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.10.3...@kong-ui-public/dashboard-renderer@0.10.4) (2024-03-12)


### Bug Fixes

* kongponents alpha phase 9 [KHCP-10951] ([#1209](https://github.com/Kong/public-ui-components/issues/1209)) ([88a2f20](https://github.com/Kong/public-ui-components/commit/88a2f20837aaaa3aef9dbe8bddd36b70f5a4558f))





## [0.10.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.10.2...@kong-ui-public/dashboard-renderer@0.10.3) (2024-03-12)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.10.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.10.1...@kong-ui-public/dashboard-renderer@0.10.2) (2024-03-08)


### Bug Fixes

* **dashboards:** fix metric card filter [MA-2719] ([#1219](https://github.com/Kong/public-ui-components/issues/1219)) ([7ca865d](https://github.com/Kong/public-ui-components/commit/7ca865d9723e43148a0dc3f068eab281e6d1dbf4))





## [0.10.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.10.0...@kong-ui-public/dashboard-renderer@0.10.1) (2024-03-08)


### Bug Fixes

* replace CopyUuid with KCopy [khcp-9465] ([#1210](https://github.com/Kong/public-ui-components/issues/1210)) ([e409d60](https://github.com/Kong/public-ui-components/commit/e409d60b7ab483c200ed6bb33f43ff571d6e6b88))





# [0.10.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.9.0...@kong-ui-public/dashboard-renderer@0.10.0) (2024-03-07)


### Bug Fixes

* **analytics:** fix dashboard renderer test ([#1216](https://github.com/Kong/public-ui-components/issues/1216)) ([dd0b77a](https://github.com/Kong/public-ui-components/commit/dd0b77a27a7d8acd323531a2102ddd67dd261e50))


### Features

* **analytics:** get config from analytics endpoint [MA-2532] ([#1208](https://github.com/Kong/public-ui-components/issues/1208)) ([3a1ae09](https://github.com/Kong/public-ui-components/commit/3a1ae09827dd5797d4fd5e93fe60935758c1c6bc))





# [0.9.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.8.2...@kong-ui-public/dashboard-renderer@0.9.0) (2024-03-07)


### Features

* **dashboard-renderer:** expand component test [MA-2629] ([#1193](https://github.com/Kong/public-ui-components/issues/1193)) ([9aaf215](https://github.com/Kong/public-ui-components/commit/9aaf215449105147f6ff35405f181da533105474))





## [0.8.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.8.1...@kong-ui-public/dashboard-renderer@0.8.2) (2024-03-07)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.8.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.8.0...@kong-ui-public/dashboard-renderer@0.8.1) (2024-03-06)


### Bug Fixes

* **dashboard-renderer:** tweak default options [MA-2709] ([#1214](https://github.com/Kong/public-ui-components/issues/1214)) ([262c2ca](https://github.com/Kong/public-ui-components/commit/262c2ca854d3faaf385867c9423e0ed915821f5d))





# [0.8.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.18...@kong-ui-public/dashboard-renderer@0.8.0) (2024-03-06)


### Features

* **dashboard-renderer:** add support for slottable tiles ([#1213](https://github.com/Kong/public-ui-components/issues/1213)) ([b36307a](https://github.com/Kong/public-ui-components/commit/b36307a89608a2cc117b50ec43d245ede6611afa))





## [0.7.18](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.17...@kong-ui-public/dashboard-renderer@0.7.18) (2024-03-06)


### Bug Fixes

* **analytics:** update metric card styles [MA-2658] ([#1206](https://github.com/Kong/public-ui-components/issues/1206)) ([d507993](https://github.com/Kong/public-ui-components/commit/d507993cb18362c94032df129147a254f9b70e0d))





## [0.7.17](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.16...@kong-ui-public/dashboard-renderer@0.7.17) (2024-03-06)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.7.16](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.15...@kong-ui-public/dashboard-renderer@0.7.16) (2024-03-04)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.7.15](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.14...@kong-ui-public/dashboard-renderer@0.7.15) (2024-03-04)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.7.14](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.13...@kong-ui-public/dashboard-renderer@0.7.14) (2024-03-01)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.7.13](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.12...@kong-ui-public/dashboard-renderer@0.7.13) (2024-02-28)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.7.12](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.11...@kong-ui-public/dashboard-renderer@0.7.12) (2024-02-27)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.7.11](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.10...@kong-ui-public/dashboard-renderer@0.7.11) (2024-02-27)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.7.10](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.9...@kong-ui-public/dashboard-renderer@0.7.10) (2024-02-27)


### Bug Fixes

* kongponents alpha phase 8 [KHCP-10758] ([#1170](https://github.com/Kong/public-ui-components/issues/1170)) ([ff130c3](https://github.com/Kong/public-ui-components/commit/ff130c3c9f1af9e9fcb09fb8c23ae758cc0a5ae2))





## [0.7.9](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.8...@kong-ui-public/dashboard-renderer@0.7.9) (2024-02-27)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.7.8](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.7...@kong-ui-public/dashboard-renderer@0.7.8) (2024-02-27)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.7.7](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.6...@kong-ui-public/dashboard-renderer@0.7.7) (2024-02-26)


### Bug Fixes

* **dashboards:** improve styling; fix properties [MA-2648] ([#1187](https://github.com/Kong/public-ui-components/issues/1187)) ([b7c9714](https://github.com/Kong/public-ui-components/commit/b7c97148f97af03b94b314ac2d915127f7e3af99))





## [0.7.6](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.5...@kong-ui-public/dashboard-renderer@0.7.6) (2024-02-26)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.7.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.4...@kong-ui-public/dashboard-renderer@0.7.5) (2024-02-26)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.7.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.3...@kong-ui-public/dashboard-renderer@0.7.4) (2024-02-24)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.7.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.2...@kong-ui-public/dashboard-renderer@0.7.3) (2024-02-24)


### Bug Fixes

* **analytics-chart:** chart height, legend padding, y-axis hover [MA-2536] ([#1179](https://github.com/Kong/public-ui-components/issues/1179)) ([14aea5b](https://github.com/Kong/public-ui-components/commit/14aea5b9c9c30d51ff6c932cfc2e8a4249270f87))





## [0.7.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.1...@kong-ui-public/dashboard-renderer@0.7.2) (2024-02-23)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.7.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.7.0...@kong-ui-public/dashboard-renderer@0.7.1) (2024-02-23)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





# [0.7.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.6.1...@kong-ui-public/dashboard-renderer@0.7.0) (2024-02-23)


### Features

* **dashboard-renderer:** merge context into queries [MA-2304] ([#1178](https://github.com/Kong/public-ui-components/issues/1178)) ([75799c0](https://github.com/Kong/public-ui-components/commit/75799c01e6fc77906eff222c14d79654284584c5))





## [0.6.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.6.0...@kong-ui-public/dashboard-renderer@0.6.1) (2024-02-22)


### Bug Fixes

* metric-card styling in dashboards ([#1176](https://github.com/Kong/public-ui-components/issues/1176)) ([7820dbe](https://github.com/Kong/public-ui-components/commit/7820dbe4282a676c40426b0359dcb89e3c2c7b3f))





# [0.6.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.5.10...@kong-ui-public/dashboard-renderer@0.6.0) (2024-02-22)


### Features

* **dashboard-renderer:** add metric card renderer [MA-2307] ([#1169](https://github.com/Kong/public-ui-components/issues/1169)) ([13c4774](https://github.com/Kong/public-ui-components/commit/13c477485cb8e31ea6d18375c8335346237f8d92))





## [0.5.10](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.5.9...@kong-ui-public/dashboard-renderer@0.5.10) (2024-02-21)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.5.9](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.5.8...@kong-ui-public/dashboard-renderer@0.5.9) (2024-02-21)


### Bug Fixes

* make sure cells are centered within their avaialble space in the grid ([#1163](https://github.com/Kong/public-ui-components/issues/1163)) ([3652454](https://github.com/Kong/public-ui-components/commit/3652454791dbff640f6ec78b3bdbaf24bde1132c))
* trigger release ([#1172](https://github.com/Kong/public-ui-components/issues/1172)) ([e33eccf](https://github.com/Kong/public-ui-components/commit/e33eccfddb8d3b0d7c4022710b4492a8728c1a71))





## [0.5.8](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.5.7...@kong-ui-public/dashboard-renderer@0.5.8) (2024-02-21)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.5.7](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.5.6...@kong-ui-public/dashboard-renderer@0.5.7) (2024-02-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.5.6](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.5.5...@kong-ui-public/dashboard-renderer@0.5.6) (2024-02-14)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.5.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.5.4...@kong-ui-public/dashboard-renderer@0.5.5) (2024-02-14)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.5.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.5.3...@kong-ui-public/dashboard-renderer@0.5.4) (2024-02-13)


### Bug Fixes

* kongponents alpha phase 7 [KHCP-10653] ([#1149](https://github.com/Kong/public-ui-components/issues/1149)) ([bd76d01](https://github.com/Kong/public-ui-components/commit/bd76d011107f92109022fc22877b795167798d01))





## [0.5.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.5.2...@kong-ui-public/dashboard-renderer@0.5.3) (2024-02-13)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.5.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.5.1...@kong-ui-public/dashboard-renderer@0.5.2) (2024-02-13)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.5.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.5.0...@kong-ui-public/dashboard-renderer@0.5.1) (2024-02-13)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





# [0.5.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.4.4...@kong-ui-public/dashboard-renderer@0.5.0) (2024-02-08)


### Features

* **analytics-chart:** support explore v4 ([#1146](https://github.com/Kong/public-ui-components/issues/1146)) ([88ccb7e](https://github.com/Kong/public-ui-components/commit/88ccb7e6e3c0172755024dc2cc49f39ec62ab30a))


### BREAKING CHANGES

* **analytics-chart:** new chart data format

* fix: address comments

* fix: useExploreResultToDatasets spec

* fix: all tests pass!

* fix: better typing, address comments

* fix: fix types

* fix: fix types

* fix: remove explore v4 -> v2/v1 translation from dashboard-renderer

* fix: don't check the timestamp in the csv export test

* fix: update test address comments

* fix: address comments

* fix: update readme





## [0.4.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.4.3...@kong-ui-public/dashboard-renderer@0.4.4) (2024-02-06)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.4.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.4.2...@kong-ui-public/dashboard-renderer@0.4.3) (2024-02-05)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.4.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.4.1...@kong-ui-public/dashboard-renderer@0.4.2) (2024-02-05)


### Bug Fixes

* kongponents alpha phase 6 [KHCP-10444] ([#1135](https://github.com/Kong/public-ui-components/issues/1135)) ([bf6d314](https://github.com/Kong/public-ui-components/commit/bf6d314c1fe657a10f64e8db926f3f3feb36ca3f))





## [0.4.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.4.0...@kong-ui-public/dashboard-renderer@0.4.1) (2024-02-05)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





# [0.4.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.24...@kong-ui-public/dashboard-renderer@0.4.0) (2024-02-01)


### Features

* **analytics:** add explore v4 types [MA-2303] ([#1129](https://github.com/Kong/public-ui-components/issues/1129)) ([8bfee21](https://github.com/Kong/public-ui-components/commit/8bfee215c29809cce7f5c5aedaa9588e6d7e8c49))





## [0.3.24](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.23...@kong-ui-public/dashboard-renderer@0.3.24) (2024-01-31)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.23](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.22...@kong-ui-public/dashboard-renderer@0.3.23) (2024-01-31)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.22](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.21...@kong-ui-public/dashboard-renderer@0.3.22) (2024-01-30)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.21](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.20...@kong-ui-public/dashboard-renderer@0.3.21) (2024-01-30)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.20](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.19...@kong-ui-public/dashboard-renderer@0.3.20) (2024-01-29)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.19](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.18...@kong-ui-public/dashboard-renderer@0.3.19) (2024-01-29)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.18](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.17...@kong-ui-public/dashboard-renderer@0.3.18) (2024-01-29)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.17](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.16...@kong-ui-public/dashboard-renderer@0.3.17) (2024-01-26)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.16](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.15...@kong-ui-public/dashboard-renderer@0.3.16) (2024-01-26)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.15](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.14...@kong-ui-public/dashboard-renderer@0.3.15) (2024-01-26)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.14](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.13...@kong-ui-public/dashboard-renderer@0.3.14) (2024-01-25)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.13](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.12...@kong-ui-public/dashboard-renderer@0.3.13) (2024-01-25)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.12](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.11...@kong-ui-public/dashboard-renderer@0.3.12) (2024-01-25)


### Bug Fixes

* **dashboard-renderer:** `console.warn` if query bridge is missing ([#1100](https://github.com/Kong/public-ui-components/issues/1100)) ([2c2cd6b](https://github.com/Kong/public-ui-components/commit/2c2cd6bc3a8b7f5b73dc0ab28e7a68a5a5785bc0))





## [0.3.11](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.10...@kong-ui-public/dashboard-renderer@0.3.11) (2024-01-25)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.10](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.9...@kong-ui-public/dashboard-renderer@0.3.10) (2024-01-24)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.9](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.8...@kong-ui-public/dashboard-renderer@0.3.9) (2024-01-23)


### Bug Fixes

* kongponents alpha phase 5 [KHCP-10381] ([#1097](https://github.com/Kong/public-ui-components/issues/1097)) ([24e5ba6](https://github.com/Kong/public-ui-components/commit/24e5ba6d6b256b092276c70e16d2e221d5be0c17))





## [0.3.8](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.7...@kong-ui-public/dashboard-renderer@0.3.8) (2024-01-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.7](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.6...@kong-ui-public/dashboard-renderer@0.3.7) (2024-01-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.6](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.5...@kong-ui-public/dashboard-renderer@0.3.6) (2024-01-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.4...@kong-ui-public/dashboard-renderer@0.3.5) (2024-01-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.3...@kong-ui-public/dashboard-renderer@0.3.4) (2024-01-18)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.3.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.2...@kong-ui-public/dashboard-renderer@0.3.3) (2024-01-17)


### Bug Fixes

* **dashboard-renderer:** default in the schema makes prop required ([#1082](https://github.com/Kong/public-ui-components/issues/1082)) ([0999681](https://github.com/Kong/public-ui-components/commit/0999681e73732df17df7e67d5d6a740a7c8a5173))





## [0.3.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.1...@kong-ui-public/dashboard-renderer@0.3.2) (2024-01-17)


### Bug Fixes

* kongponents alpha phase 4 [KHCP-10182] ([#1069](https://github.com/Kong/public-ui-components/issues/1069)) ([8dc4cb0](https://github.com/Kong/public-ui-components/commit/8dc4cb060fc5414381824b1eb8ce7691d1346ce5))





## [0.3.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.3.0...@kong-ui-public/dashboard-renderer@0.3.1) (2024-01-17)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





# [0.3.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.28...@kong-ui-public/dashboard-renderer@0.3.0) (2024-01-16)


### Bug Fixes

* **analytics-chart:** sizing and overflow issues plus vertical scroll ([#1072](https://github.com/Kong/public-ui-components/issues/1072)) ([e8c0bba](https://github.com/Kong/public-ui-components/commit/e8c0bba1ed227a8c329e1bf2ff4f1c5b1689faa5))


### BREAKING CHANGES

* **analytics-chart:** - No more hight and width props. Host app must wrap in a container that explicitely
sets width and height.
- There is vertical scroll now in bar charts verify in host apps where applicable.

* fix: address comments

* fix: address comments round 2

* fix: better dimensions calculation

* fix: comment





## [0.2.28](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.27...@kong-ui-public/dashboard-renderer@0.2.28) (2024-01-15)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.27](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.26...@kong-ui-public/dashboard-renderer@0.2.27) (2024-01-12)


### Bug Fixes

* widen peer dependencies ([#1071](https://github.com/Kong/public-ui-components/issues/1071)) ([4a345d2](https://github.com/Kong/public-ui-components/commit/4a345d28f53d9248846a9ffc4ed1011d6ff8616f))





## [0.2.26](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.25...@kong-ui-public/dashboard-renderer@0.2.26) (2024-01-12)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.25](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.24...@kong-ui-public/dashboard-renderer@0.2.25) (2024-01-11)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.24](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.23...@kong-ui-public/dashboard-renderer@0.2.24) (2024-01-10)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.23](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.22...@kong-ui-public/dashboard-renderer@0.2.23) (2024-01-09)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.22](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.21...@kong-ui-public/dashboard-renderer@0.2.22) (2024-01-01)


### Bug Fixes

* **deps:** update all non-major dependencies with stable version ([#1042](https://github.com/Kong/public-ui-components/issues/1042)) ([6112776](https://github.com/Kong/public-ui-components/commit/61127764e7f193177a394e292db30ff11aab0409))





## [0.2.21](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.20...@kong-ui-public/dashboard-renderer@0.2.21) (2023-12-27)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.20](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.19...@kong-ui-public/dashboard-renderer@0.2.20) (2023-12-22)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.19](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.18...@kong-ui-public/dashboard-renderer@0.2.19) (2023-12-22)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.18](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.17...@kong-ui-public/dashboard-renderer@0.2.18) (2023-12-21)


### Bug Fixes

* type exports ([efecd88](https://github.com/Kong/public-ui-components/commit/efecd8859a01aae41d9490b1758237233c925c19))





## [0.2.17](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.16...@kong-ui-public/dashboard-renderer@0.2.17) (2023-12-20)


### Bug Fixes

* add design tokens plugin ([#1024](https://github.com/Kong/public-ui-components/issues/1024)) ([0d6b971](https://github.com/Kong/public-ui-components/commit/0d6b971fc8fb13ea32714416f8d20ce8f5ecf35e))





## [0.2.16](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.15...@kong-ui-public/dashboard-renderer@0.2.16) (2023-12-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.15](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.14...@kong-ui-public/dashboard-renderer@0.2.15) (2023-12-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.14](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.13...@kong-ui-public/dashboard-renderer@0.2.14) (2023-12-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.13](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.12...@kong-ui-public/dashboard-renderer@0.2.13) (2023-12-19)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.12](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.11...@kong-ui-public/dashboard-renderer@0.2.12) (2023-12-18)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.11](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.10...@kong-ui-public/dashboard-renderer@0.2.11) (2023-12-18)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.10](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.9...@kong-ui-public/dashboard-renderer@0.2.10) (2023-12-15)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.9](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.8...@kong-ui-public/dashboard-renderer@0.2.9) (2023-12-15)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.8](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.7...@kong-ui-public/dashboard-renderer@0.2.8) (2023-12-12)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.7](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.6...@kong-ui-public/dashboard-renderer@0.2.7) (2023-12-12)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.6](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.5...@kong-ui-public/dashboard-renderer@0.2.6) (2023-12-12)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.4...@kong-ui-public/dashboard-renderer@0.2.5) (2023-12-11)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.3...@kong-ui-public/dashboard-renderer@0.2.4) (2023-12-08)


### Bug Fixes

* kongponents alpha phase 3 [KHCP-9942] ([#985](https://github.com/Kong/public-ui-components/issues/985)) ([dc61424](https://github.com/Kong/public-ui-components/commit/dc61424540d15386c73db9d106143dc7e50714de))





## [0.2.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.2...@kong-ui-public/dashboard-renderer@0.2.3) (2023-12-07)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.1...@kong-ui-public/dashboard-renderer@0.2.2) (2023-12-05)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.2.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.2.0...@kong-ui-public/dashboard-renderer@0.2.1) (2023-12-05)


### Bug Fixes

* update kcard usage [KHCP-9887] ([#977](https://github.com/Kong/public-ui-components/issues/977)) ([3f00e69](https://github.com/Kong/public-ui-components/commit/3f00e69fd65d1eae07139cee52afb16825f34a9b))





# [0.2.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.1.14...@kong-ui-public/dashboard-renderer@0.2.0) (2023-12-01)


### Features

* dashboard renderer grid layout ([#964](https://github.com/Kong/public-ui-components/issues/964)) ([3bb8210](https://github.com/Kong/public-ui-components/commit/3bb8210944ff9ed1ae27d33bd9daaeb7b8e39913))





## [0.1.14](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.1.13...@kong-ui-public/dashboard-renderer@0.1.14) (2023-12-01)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.1.13](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.1.12...@kong-ui-public/dashboard-renderer@0.1.13) (2023-12-01)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.1.12](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.1.11...@kong-ui-public/dashboard-renderer@0.1.12) (2023-12-01)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.1.11](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.1.10...@kong-ui-public/dashboard-renderer@0.1.11) (2023-11-30)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.1.10](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.1.9...@kong-ui-public/dashboard-renderer@0.1.10) (2023-11-30)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.1.9](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.1.8...@kong-ui-public/dashboard-renderer@0.1.9) (2023-11-29)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.1.8](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.1.7...@kong-ui-public/dashboard-renderer@0.1.8) (2023-11-28)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.1.7](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.1.6...@kong-ui-public/dashboard-renderer@0.1.7) (2023-11-28)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.1.6](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.1.5...@kong-ui-public/dashboard-renderer@0.1.6) (2023-11-27)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.1.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.1.4...@kong-ui-public/dashboard-renderer@0.1.5) (2023-11-24)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.1.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.1.3...@kong-ui-public/dashboard-renderer@0.1.4) (2023-11-22)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.1.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.1.2...@kong-ui-public/dashboard-renderer@0.1.3) (2023-11-21)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.1.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.1.1...@kong-ui-public/dashboard-renderer@0.1.2) (2023-11-20)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





## [0.1.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/dashboard-renderer@0.1.0...@kong-ui-public/dashboard-renderer@0.1.1) (2023-11-20)

**Note:** Version bump only for package @kong-ui-public/dashboard-renderer





# 0.1.0 (2023-11-16)


### Features

* **dashboards:** add initial version of dashboard renderer [MA-2267] ([#922](https://github.com/Kong/public-ui-components/issues/922)) ([2133cc9](https://github.com/Kong/public-ui-components/commit/2133cc9c627e385e7ca78577a5a65067029aea93))
