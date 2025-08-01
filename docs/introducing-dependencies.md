# Introducing dependencies

In a traditional monorepo setup, each package typically manages its own dependencies independently. While many of these dependencies are often similar across packages, manually updating them can be tedious and prone to conflicts—especially when multiple teams are involved.

## Pnpm catalog

To solve the version sync issue, `pnpm` provides a feature called [catalog](https://pnpm.io/catalogs). The catalog allows you to define a set of shared dependencies that can be used across all packages in the monorepo. This way, you can ensure that all packages are using the same version of a dependency without having to manually update each package.

### Benefits

- Flexibility: while we can define a set of shared dependencies, we can also override them in individual packages if needed.
- Easier maintenance: upgrading the dependencies in `pnpm-workspace.yaml`, rather than in each package's `package.json`, makes it easier to maintain the monorepo.
- Less conflict: since we are not touching the `package.json` files of each package, we reduce the chances of conflicts when working with different teams.

### How to use

- If your package wants to introduce a new dependency, the first step recommended is to check if `pnpm-workspace.yaml` already has the dependency defined. If it does, you can simply use `catalog:` protocol in your `package.json` file to use the unified version.

- If the dependency is not defined, it is recommended to add it to `pnpm-workspace.yaml` under the `catalog:` section. This way, if any other packages needs the same dependency in the future, they can simply use the version defined in the catalog.
