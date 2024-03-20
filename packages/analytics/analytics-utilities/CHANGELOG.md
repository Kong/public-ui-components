# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [2.0.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@2.0.0...@kong-ui-public/analytics-utilities@2.0.1) (2024-03-20)


### Bug Fixes

* **deps:** update dependency date-fns-tz to ^2.0.1 ([#1269](https://github.com/Kong/public-ui-components/issues/1269)) ([0d727ab](https://github.com/Kong/public-ui-components/commit/0d727ab1d574a9ed63f4fe1c61c474452213d3fc))





# [2.0.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@1.4.0...@kong-ui-public/analytics-utilities@2.0.0) (2024-03-19)


### Features

* **analytics:** move to v2 config endpoint [MA-2730] ([#1257](https://github.com/Kong/public-ui-components/issues/1257)) ([e61e42f](https://github.com/Kong/public-ui-components/commit/e61e42fddb221a8e04f7faa18aa965bf7584d0e3))


### BREAKING CHANGES

* **analytics:** new config endpoint; types updated

The following components are updated:

- AnalyticsConfigCheck, and the associated store
- MetricsProviderInternal
- AnalyticsBridge (updates type that implementations must adhere to)
- DashboardRenderer (sandbox and tests)





# [1.4.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@1.3.1...@kong-ui-public/analytics-utilities@1.4.0) (2024-03-13)


### Features

* **analytics:** add types for config V2 ([#1235](https://github.com/Kong/public-ui-components/issues/1235)) ([dcd3dfe](https://github.com/Kong/public-ui-components/commit/dcd3dfeeb59a22e2d1d133c24375945ec3eeeca1))





## [1.3.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@1.3.0...@kong-ui-public/analytics-utilities@1.3.1) (2024-03-12)


### Bug Fixes

* standardize analytics retention ([#1228](https://github.com/Kong/public-ui-components/issues/1228)) ([0cb6d64](https://github.com/Kong/public-ui-components/commit/0cb6d644156d1f7f5f2df7878b5ce94136a0a2db))





# [1.3.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@1.2.0...@kong-ui-public/analytics-utilities@1.3.0) (2024-03-07)


### Features

* **analytics:** get config from analytics endpoint [MA-2532] ([#1208](https://github.com/Kong/public-ui-components/issues/1208)) ([3a1ae09](https://github.com/Kong/public-ui-components/commit/3a1ae09827dd5797d4fd5e93fe60935758c1c6bc))





# [1.2.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@1.1.2...@kong-ui-public/analytics-utilities@1.2.0) (2024-03-07)


### Features

* **dashboard-renderer:** expand component test [MA-2629] ([#1193](https://github.com/Kong/public-ui-components/issues/1193)) ([9aaf215](https://github.com/Kong/public-ui-components/commit/9aaf215449105147f6ff35405f181da533105474))





## [1.1.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@1.1.1...@kong-ui-public/analytics-utilities@1.1.2) (2024-02-24)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [1.1.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@1.1.0...@kong-ui-public/analytics-utilities@1.1.1) (2024-02-21)


### Bug Fixes

* **metric-provider:** include timezone in v4 queries ([#1173](https://github.com/Kong/public-ui-components/issues/1173)) ([4eaad9e](https://github.com/Kong/public-ui-components/commit/4eaad9ef8ed9790add498410ef20dc8df70d8ba0))





# [1.1.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.15.0...@kong-ui-public/analytics-utilities@1.1.0) (2024-02-19)


### Features

* **utilities:** add new timeframe methods [MA-1960] ([#1165](https://github.com/Kong/public-ui-components/issues/1165)) ([6ff38ef](https://github.com/Kong/public-ui-components/commit/6ff38efb4e0e1a23a61ca94ab0296234fa7fd6d0))





# [0.15.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.14.1...@kong-ui-public/analytics-utilities@0.15.0) (2024-02-13)


### Features

* **query-time:** add second-level granularity [MA-2594] ([#1155](https://github.com/Kong/public-ui-components/issues/1155)) ([7aa9ced](https://github.com/Kong/public-ui-components/commit/7aa9cedcbaa490845ae525f76092524b66c1b3c2))





## [0.14.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.14.0...@kong-ui-public/analytics-utilities@0.14.1) (2024-02-13)


### Bug Fixes

* **explore-types:** move granularity to an enum [MA-2594] ([#1148](https://github.com/Kong/public-ui-components/issues/1148)) ([a5e62d6](https://github.com/Kong/public-ui-components/commit/a5e62d6e80536bc8ad9a8e1b6ba36083ccc48585))





# [0.14.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.13.1...@kong-ui-public/analytics-utilities@0.14.0) (2024-02-08)


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





## [0.13.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.13.0...@kong-ui-public/analytics-utilities@0.13.1) (2024-02-06)


### Bug Fixes

* **explore-types:** update granularity in response meta [MA-2303] ([#1145](https://github.com/Kong/public-ui-components/issues/1145)) ([4888aca](https://github.com/Kong/public-ui-components/commit/4888aca6492703543bf12abade1339f9b54d931c))





# [0.13.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.12.0...@kong-ui-public/analytics-utilities@0.13.0) (2024-02-01)


### Features

* **analytics:** add explore v4 types [MA-2303] ([#1129](https://github.com/Kong/public-ui-components/issues/1129)) ([8bfee21](https://github.com/Kong/public-ui-components/commit/8bfee215c29809cce7f5c5aedaa9588e6d7e8c49))





# [0.12.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.11.5...@kong-ui-public/analytics-utilities@0.12.0) (2024-01-30)


### Features

* **analytics-chart:** migrate relevant things from konnect-vitals [MA-2557] ([#1124](https://github.com/Kong/public-ui-components/issues/1124)) ([6005513](https://github.com/Kong/public-ui-components/commit/600551331478c22c0ae4d16e0fb09ceecadaf4b1))





## [0.11.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.11.4...@kong-ui-public/analytics-utilities@0.11.5) (2024-01-26)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.11.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.11.3...@kong-ui-public/analytics-utilities@0.11.4) (2024-01-25)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.11.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.11.2...@kong-ui-public/analytics-utilities@0.11.3) (2024-01-09)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.11.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.11.1...@kong-ui-public/analytics-utilities@0.11.2) (2023-12-21)


### Bug Fixes

* type exports ([efecd88](https://github.com/Kong/public-ui-components/commit/efecd8859a01aae41d9490b1758237233c925c19))





## [0.11.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.11.0...@kong-ui-public/analytics-utilities@0.11.1) (2023-12-20)


### Bug Fixes

* add design tokens plugin ([#1024](https://github.com/Kong/public-ui-components/issues/1024)) ([0d6b971](https://github.com/Kong/public-ui-components/commit/0d6b971fc8fb13ea32714416f8d20ce8f5ecf35e))





# [0.11.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.10.6...@kong-ui-public/analytics-utilities@0.11.0) (2023-12-12)


### Features

* **update-analytics-types:** Update types for null-positions, and grouped display ([#991](https://github.com/Kong/public-ui-components/issues/991)) ([50f7b12](https://github.com/Kong/public-ui-components/commit/50f7b12bbc7120fb30a72277c5895e50ac292646))





## [0.10.6](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.10.5...@kong-ui-public/analytics-utilities@0.10.6) (2023-12-07)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.10.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.10.4...@kong-ui-public/analytics-utilities@0.10.5) (2023-11-30)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.10.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.10.3...@kong-ui-public/analytics-utilities@0.10.4) (2023-11-29)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.10.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.10.2...@kong-ui-public/analytics-utilities@0.10.3) (2023-11-28)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.10.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.10.1...@kong-ui-public/analytics-utilities@0.10.2) (2023-11-21)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.10.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.10.0...@kong-ui-public/analytics-utilities@0.10.1) (2023-11-07)


### Bug Fixes

* add timeframe interface ([#902](https://github.com/Kong/public-ui-components/issues/902)) ([272238a](https://github.com/Kong/public-ui-components/commit/272238ad8da5719d785beb9769afdb4ac25bb772))





# [0.10.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.9.1...@kong-ui-public/analytics-utilities@0.10.0) (2023-11-07)


### Code Refactoring

* **TopN:** remove support for old explore v3 format [MA-2094] ([#897](https://github.com/Kong/public-ui-components/issues/897)) ([7bcf548](https://github.com/Kong/public-ui-components/commit/7bcf548b8144932eb034f992de98aa82d3af3845))


### BREAKING CHANGES

* **TopN:** removed support for old display blob style.





## [0.9.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.9.0...@kong-ui-public/analytics-utilities@0.9.1) (2023-11-03)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





# [0.9.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.8.8...@kong-ui-public/analytics-utilities@0.9.0) (2023-11-02)


### Features

* **analytics-*:** support additional explore v3 variation [MA-2094] ([#884](https://github.com/Kong/public-ui-components/issues/884)) ([8955195](https://github.com/Kong/public-ui-components/commit/8955195b17ab1341b6d87eb7a5e730494c68924f))





## [0.8.8](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.8.7...@kong-ui-public/analytics-utilities@0.8.8) (2023-11-01)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.8.7](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.8.6...@kong-ui-public/analytics-utilities@0.8.7) (2023-10-30)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.8.6](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.8.5...@kong-ui-public/analytics-utilities@0.8.6) (2023-10-24)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.8.5](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.8.4...@kong-ui-public/analytics-utilities@0.8.5) (2023-10-23)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.8.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.8.3...@kong-ui-public/analytics-utilities@0.8.4) (2023-10-18)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.8.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.8.2...@kong-ui-public/analytics-utilities@0.8.3) (2023-10-06)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.8.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.8.1...@kong-ui-public/analytics-utilities@0.8.2) (2023-09-28)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.8.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.8.0...@kong-ui-public/analytics-utilities@0.8.1) (2023-09-27)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





# [0.8.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.7.3...@kong-ui-public/analytics-utilities@0.8.0) (2023-09-14)


### Features

* **analytics-utilities:** Add date formatting support [MA-1969] ([#785](https://github.com/Kong/public-ui-components/issues/785)) ([31578b4](https://github.com/Kong/public-ui-components/commit/31578b477451bbf7e0dc3783acaad3c5b683a489))





## [0.7.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.7.2...@kong-ui-public/analytics-utilities@0.7.3) (2023-09-09)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.7.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.7.1...@kong-ui-public/analytics-utilities@0.7.2) (2023-08-25)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.7.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.7.0...@kong-ui-public/analytics-utilities@0.7.1) (2023-08-22)


### Bug Fixes

* **tsconfig:** apply `@vue/tsconfig` ([#729](https://github.com/Kong/public-ui-components/issues/729)) ([c8aeca7](https://github.com/Kong/public-ui-components/commit/c8aeca7bed27ad0347183744096a5524d1852568))





# [0.7.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.6.0...@kong-ui-public/analytics-utilities@0.7.0) (2023-08-21)


### Features

* **analytics:** add interface for explore v3 types ([#727](https://github.com/Kong/public-ui-components/issues/727)) ([793d213](https://github.com/Kong/public-ui-components/commit/793d213724c5a9f73140a85084f3d2d0191692a2))





# [0.6.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.5.4...@kong-ui-public/analytics-utilities@0.6.0) (2023-08-21)


### Features

* **queryTime:** support doing calculations in a specific TZ [MA-1916] ([#722](https://github.com/Kong/public-ui-components/issues/722)) ([c6c4b0a](https://github.com/Kong/public-ui-components/commit/c6c4b0a6492290cd6071516f8d9985070a49b06e))





## [0.5.4](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.5.3...@kong-ui-public/analytics-utilities@0.5.4) (2023-08-18)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.5.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.5.2...@kong-ui-public/analytics-utilities@0.5.3) (2023-08-11)


### Bug Fixes

* **timeframes:** fix bug in previous month calculation [MA-1583] ([#698](https://github.com/Kong/public-ui-components/issues/698)) ([8927ad3](https://github.com/Kong/public-ui-components/commit/8927ad3f6ab0b11790416d55040f869b26ede80b))





## [0.5.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.5.1...@kong-ui-public/analytics-utilities@0.5.2) (2023-08-11)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





## [0.5.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.5.0...@kong-ui-public/analytics-utilities@0.5.1) (2023-08-07)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





# [0.5.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.4.3...@kong-ui-public/analytics-utilities@0.5.0) (2023-07-25)


### Features

* add design tokens and remove utility classes [KHCP-8172] ([#624](https://github.com/Kong/public-ui-components/issues/624)) ([dbdc995](https://github.com/Kong/public-ui-components/commit/dbdc995dacdc7ba97f103185dfee71a0372d7207))





## [0.4.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.4.2...@kong-ui-public/analytics-utilities@0.4.3) (2023-06-29)


### Bug Fixes

* **version-optional:** AnalyticsRecord versions are optional ([#591](https://github.com/Kong/public-ui-components/issues/591)) ([dc943c9](https://github.com/Kong/public-ui-components/commit/dc943c9c7c970ca9796714a06107e3e453b156a3))





## [0.4.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.4.1...@kong-ui-public/analytics-utilities@0.4.2) (2023-06-01)


### Bug Fixes

* **analytics-utilities:** support commonjs ([#486](https://github.com/Kong/public-ui-components/issues/486)) ([196454b](https://github.com/Kong/public-ui-components/commit/196454be4b17fbe11be61192c7bf279b050cb124))





## [0.4.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.4.0...@kong-ui-public/analytics-utilities@0.4.1) (2023-05-31)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





# [0.4.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.3.1...@kong-ui-public/analytics-utilities@0.4.0) (2023-05-26)


### Features

* define and check dist size limit [KHCP-7179] ([#455](https://github.com/Kong/public-ui-components/issues/455)) ([02e4d0a](https://github.com/Kong/public-ui-components/commit/02e4d0ae354b7d30a63856110e58b10e335d8134))





## [0.3.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.3.0...@kong-ui-public/analytics-utilities@0.3.1) (2023-05-26)


### Bug Fixes

* **analytics-utilities:** Add `startMs` and `endMs` to interface ([#473](https://github.com/Kong/public-ui-components/issues/473)) ([27102d1](https://github.com/Kong/public-ui-components/commit/27102d18d04eaf2e8df149d2250f84a8382bd771))





# [0.3.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.2.1...@kong-ui-public/analytics-utilities@0.3.0) (2023-05-19)


### Features

* also allow v2 meta in explore result [MA-1675] ([#440](https://github.com/Kong/public-ui-components/issues/440)) ([3f7aeca](https://github.com/Kong/public-ui-components/commit/3f7aeca07410601256ac97515d82cf96182b070c))





## [0.2.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.2.0...@kong-ui-public/analytics-utilities@0.2.1) (2023-05-19)


### Bug Fixes

* **deps:** update dependency date-fns to ^2.30.0 ([#438](https://github.com/Kong/public-ui-components/issues/438)) ([46f9e89](https://github.com/Kong/public-ui-components/commit/46f9e893df07c46d6846719a17c4a495a0310bb9))





# [0.2.0](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.1.3...@kong-ui-public/analytics-utilities@0.2.0) (2023-05-04)


### Features

* **query-time:** add `startMs` and `endMs` helpers to QueryTime ([#388](https://github.com/Kong/public-ui-components/issues/388)) ([86f0a40](https://github.com/Kong/public-ui-components/commit/86f0a409fa6ecb56a44b5dc4baa965acf6189fe0))





## [0.1.3](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.1.2...@kong-ui-public/analytics-utilities@0.1.3) (2023-05-03)


### Bug Fixes

* **explore-v2-meta:** Adding explore-v2 meta blob. start->startMs, end->endMs ([#383](https://github.com/Kong/public-ui-components/issues/383)) ([d7ad35d](https://github.com/Kong/public-ui-components/commit/d7ad35d2352705a986f8ea5af49981c5c077f02c))





## [0.1.2](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.1.1...@kong-ui-public/analytics-utilities@0.1.2) (2023-05-01)


### Bug Fixes

* **analytics:** sanitize filenames [MA-1651] ([#366](https://github.com/Kong/public-ui-components/issues/366)) ([8990dba](https://github.com/Kong/public-ui-components/commit/8990dba7ea9d6a982e4ce74b6115849c6f81e4de))





## [0.1.1](https://github.com/Kong/public-ui-components/compare/@kong-ui-public/analytics-utilities@0.1.0...@kong-ui-public/analytics-utilities@0.1.1) (2023-04-25)

**Note:** Version bump only for package @kong-ui-public/analytics-utilities





# 0.1.0 (2023-04-20)


### Features

* **analytics-utils:** add analytics utils package ([#323](https://github.com/Kong/public-ui-components/issues/323)) ([82fae09](https://github.com/Kong/public-ui-components/commit/82fae094c2d85aecc9802bab53b6fdbd6e9b7514))
