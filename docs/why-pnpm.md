# Why pnpm?

[`pnpm`](https://pnpm.io/motivation) is a relatively new package manager for Node. It's fully-featured and essentially a drop-in replacement for `npm` or `yarn`. The decision to use `pnpm` over more traditional package managers came down to the following reasons:

1. Performant dependency installation and efficient usage of `node_modules` disk space. A monorepo that supports a wide array of packages across an engineering organization will accumulate __a lot__ of dependencies over time. Performance and efficiency when handling these dependencies is critical.
1. First class monorepo support. [`pnpm workspaces`](https://pnpm.io/workspaces) and a global `--filter` CLI argument that enables running commands against a subset of packages within the monorepo.
1. First class _Typescript_ monorepo support. Customizable [`publishConfig`](https://pnpm.io/package_json#publishconfig) within `package.json` files enables all packages to use .ts `main` entrypoints. This small feature really improves the DX of maintaining a TS monorepo.

`pnpm` has many more features that you will not find in `npm` or `yarn`. Please refer to the pnpm [docs](https://pnpm.io/motivation) to find out more.
