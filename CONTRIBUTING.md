# Contributing to Dash

To contribute to this project, first:

- Fork this repo to your account
- `mkdir dash-ui`
- `cd dash-ui`
- `git clone https://github.com/[your-username]/styles.git`
- `cd styles`
- `yarn install`

## Before you contribute

Before you submit PRs to this repo I ask that you consider the following:

- Creating an issue first. **Any change needs to be discussed before proceeding.** Failure to do so may result in the rejection of the pull request.
- Is this useful? That is, does it fix something that is broken? Does it add a feature that is a _real_ need?
- Is this better implemented in user space or in its own package?
- Will this bloat the bundle size?

Before your PR will be considered I will look for:

- **Documentation** Please submit updates to the docs when public-facing APIs are changed.
- **Tests** Your PR will not be accepted if it doesn't have well-designed tests. Additionally, make sure
  that you run `yarn validate` before you submit your PR and make sure your PR passes the linting rules,
  type checking, and tests that already exist.
- **Types** Your types should be as strong as possible.
- **Comments** If your PR implements non-obvious logic, I fully expect you to explain the rationale in
  the form of code comments. I also expect you to update existing comments if the PR changes the behavior
  of existing code that could make those comments stale.

## Development

Here's what you need to know to start developing Dash.

### Package scripts

#### `build`

Builds types, commonjs, and module distributions

#### `check-types`

Runs a type check on the project using the local `tsconfig.json`

#### `dev`

Builds `module` and `cjs` builds in `watch` mode

#### `format`

Formats all of the applicable source files with prettier

#### `lint`

Runs `eslint` on the package source

#### `prerelease`

Runs before the package is published. This calls `validate` and `build` scripts.

#### `release`

Starts a release using `standard-version`. This must be run before `npm publish`.

#### `test`

Tests the package with `jest`

#### `validate`

Runs `check-types`, `lint`, and `test` scripts. This is used in CI and
in `prerelease`.

---

### Husky hooks

#### `pre-commit`

Runs `lint-staged` and the `build-types` script

#### `commit-msg`

Runs `commitlint` on your commit message. The easiest way
to conform to `standard-version` rules is to use [`cz-cli`](https://github.com/commitizen/cz-cli)
