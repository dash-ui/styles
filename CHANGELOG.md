# Changelog

All notable changes to this project will be documented in this file. See [standard-version](https://github.com/conventional-changelog/standard-version) for commit guidelines.

### [0.7.3](https://github.com/dash-ui/styles/compare/v0.7.2...v0.7.3) (2020-07-22)

### [0.7.2](https://github.com/dash-ui/styles/compare/v0.7.1...v0.7.2) (2020-07-21)

### [0.7.1](https://github.com/dash-ui/styles/compare/v0.7.0...v0.7.1) (2020-07-21)

## [0.7.0](https://github.com/dash-ui/styles/compare/v0.6.2...v0.7.0) (2020-07-20)

### ⚠ BREAKING CHANGES

- **styles:** Normalizes CSS strings instead of minifying them. This will potentially result in
  changes to class names.

- **styles:** normalize css strings but don't minify ([dfa3e25](https://github.com/dash-ui/styles/commit/dfa3e25f57db15dbfd64f13ff28ef306fbf5bd27))

### [0.6.2](https://github.com/dash-ui/styles/compare/v0.6.1...v0.6.2) (2020-07-17)

### Features

- **styles:** add css variables to styles instance ([96c81b7](https://github.com/dash-ui/styles/commit/96c81b7c8e4d1769e050c35d0f1ff75912783e58))

### [0.6.1](https://github.com/dash-ui/styles/compare/v0.6.0...v0.6.1) (2020-07-16)

### Bug Fixes

- **server:** fix server types in package ([64d5ded](https://github.com/dash-ui/styles/commit/64d5dedc279a91b9bfd4772758158ce32a5dfde9))

## [0.6.0](https://github.com/dash-ui/styles/compare/v0.5.2...v0.6.0) (2020-07-16)

### ⚠ BREAKING CHANGES

- **styles:** Dash options are no longer assignable to `createStyles()`. Now, you have to ceate a
  dash instance with `createDash()` and provide it to the `dash` option in `createStyles()` options.
- **styles:** Previously hash was accessible via `styles.dash.hash`, it is now only accessible
  from `styles.hash`
- **styles:** Removes the `clear()` method from the Dash instance in favor of `inserted.clear()`
- **server:** The `styles` property in the result object of `writeStyles` functions has been
  renamed to `css` in order to match the rest of the server api.
- **server:** `createStylesFromString()`, `writeStylesFromString()` no longer have a `clearCache`
  option
- **styles:** `styles.global()` was renamed `styles.insertGlobal()`, `styles.variables()` was
  renamed `styles.insertVariables()`, `styles.themes()` was renamed `styles.insertThemes()`
- **styles:** Removes `variables` option from `createDash()` and removes the `variables` property
  from the object returned by `createDash()`
- **styles:** Removes toString() methods from styles.one and styles.one.css
- **styles:** You can no longer import the default styles function via default export e.g.
  `import styles from '@dash-ui/styles'. You have to instead use a named export e.g.`import {styles}
  from '@dash-ui/styles'`
- **styles:** Refactor dash.inserted to use Set(), dash.cache and dash.sheets to use Map()

### Bug Fixes

- **server:** fix createStylesFromString regex ([41b2267](https://github.com/dash-ui/styles/commit/41b2267c1eb192d425d9f3f92965061618d9c2be))
- **server:** remove clearCache option from createStylesFromString ([3f910d3](https://github.com/dash-ui/styles/commit/3f910d350a170cf4070156aa94401a38b7a60af0))
- **styles:** fix attr.map() should be attr.forEach() ([8a9df4f](https://github.com/dash-ui/styles/commit/8a9df4f349eb06fe5b13c72b13eadabbb044fc50))
- **styles:** make keyframes persist between server `clearCache` calls ([a3af977](https://github.com/dash-ui/styles/commit/a3af9779af7ad83be6c198f758babcf4032dfd4c))
- **styles:** prevent uncompiled variables from being set initially ([d3c9881](https://github.com/dash-ui/styles/commit/d3c9881dec66b449eb6f90327e46a071de7d41a4))
- stop minifying compiled object style result ([aa8035d](https://github.com/dash-ui/styles/commit/aa8035de1852919ab25d23f0075176f298ed04ce))

* **server:** rename styles to css in the writeFile functions ([0118b18](https://github.com/dash-ui/styles/commit/0118b184da52b3acb40deff6e946456babe143b9))
* **styles:** add clarity to the public api ([2a08830](https://github.com/dash-ui/styles/commit/2a08830a1ab595eef0e6af05f61b41e9c1f24c25))
* **styles:** add dash as a configuration option ([b9b227c](https://github.com/dash-ui/styles/commit/b9b227c7f77adabd9c69c02ff1f157232831e1f5))
* **styles:** move hash option from createDash to createStyles ([7a5cfc9](https://github.com/dash-ui/styles/commit/7a5cfc95e06402ccdb979e9f76a0a931eacac18e))
* **styles:** move variables object from dash to styles ([1dfb447](https://github.com/dash-ui/styles/commit/1dfb4472835619912b2484e9ed80da1b23e2ee04))
* **styles:** refactor cache to use Map/Set ([2be1e22](https://github.com/dash-ui/styles/commit/2be1e22eaf972f7f74cb69e2009d7b640c3d4141))
* **styles:** remove `clear()` from dash instance ([b98c741](https://github.com/dash-ui/styles/commit/b98c741cbb0f9590ad7d963a32ea99bbf281a673))
* **styles:** remove default export ([6bd20b8](https://github.com/dash-ui/styles/commit/6bd20b83be730244ce1b2a1a6e3d9c031f3fe197))
* **styles:** remove superfluous toString() methods in styles.one ([1b73790](https://github.com/dash-ui/styles/commit/1b73790352ed54c6edccb3f4781123b32d88fad1))

### [0.5.2](https://github.com/dash-ui/styles/compare/v0.5.1...v0.5.2) (2020-07-11)

### Bug Fixes

- **deps:** force stylis fixes ([de565e8](https://github.com/dash-ui/styles/commit/de565e8e4cc98163128c66f9f3fc522dd4cb6f65))

### [0.5.1](https://github.com/dash-ui/styles/compare/v0.5.0...v0.5.1) (2020-07-10)

### Features

- **styles:** add cls() function ([91bc605](https://github.com/dash-ui/styles/commit/91bc605266e71c6bfeec84108438df95c9e932b4))

## 0.5.0 (2020-06-17)
