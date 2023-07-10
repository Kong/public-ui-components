# @kong-ui-public/cli

A ts-node CLI for creating new `public-ui-components` packages.

- [Features](#features)
- [Usage](#usage)
- [Workspaces](#workspaces)
  - [Workspace name requirements](#workspace-name-requirements)
  - [Creating a new workspace](#creating-a-new-workspace)

## Features

- Scaffolds out a new project within one of the predefined repository workspaces: `packages/{workspace}/{package-name}`

## Usage

For complete documentation on creating a new package, please refer to the [Creating a package docs](../../../docs/creating-a-package.md).

1. Always get the latest from `main` branch before creating a new package

    ```sh
    git pull origin main
    ```

1. Run the install command to build the CLI

    ```sh
    pnpm install
    ```

1. Run the CLI to create a new package

    ```sh
    pnpm run create-package
    ```

## Workspaces

Workspaces are defined in the repository as the immediate children of the `/packages/*` directory.

The currently available workspaces include:

- `analytics`
- `core`
- `entities`
- `portal`

New workspaces **must** be added and configured by `@Kong/team-core-ui` following the [Creating a new workspace instructions below](#creating-a-new-workspace).

Reach out on Slack in `#team-konnect-core-ui` or tag `@Kong/team-core-ui` on GitHub if you believe you need a new workspace created in this repository.

### Workspace name requirements

1. Workspace names **must** be lowercase, kebab-case strings consisting of only letters `a-z` and dashes `-`
1. The workspace name **must** start with a letter.
1. Workspace names **must not** utilize the name of another workspace. For example, there is already a `analytics` workspace. You cannot create a new workspace named `analytics-widgets`.
1. The name `other` is reserved and should not be used as a workspace name.

### Creating a new workspace

> **Important**: New workspaces should be added with caution and are only needed to group large, related groups of packages.

#### Adding a new workspace to the CLI

1. Checkout a new branch of the repository.
1. Manually create a new directory in this repository with the workspace name as an immediate child of the `/packages/` directory.
1. Create an empty file at the root of the new workspace directory named `.gitkeep`. This should currently be the only file in the workspace directory.
1. Add the new workspace name (in alphabetical order) to the choice list defined in the [`questions.ts` file](src/questions.ts).
1. Add the name to the list of available workspaces (in alphabetical order) in this README file.
1. Open a pull request to merge these changes into the `main` branch. **You should not create any packages within the workspace in this same branch or pull request.**
