# [1.0.0-alpha.9](https://github.com/dash-ui/styles/compare/v1.0.0-alpha.8...v1.0.0-alpha.9) (2021-11-01)


### Bug Fixes

* force new release ([ef36377](https://github.com/dash-ui/styles/commit/ef36377833784b208834a839c5b31915e066cc94))

# [1.0.0-alpha.8](https://github.com/dash-ui/styles/compare/v1.0.0-alpha.7...v1.0.0-alpha.8) (2021-11-01)


### Bug Fixes

* fix labels for numeric tokens ([8415c81](https://github.com/dash-ui/styles/commit/8415c81977d89bf8d97a4a0e80cc1d0ba07c559c))

# [1.0.0-alpha.7](https://github.com/dash-ui/styles/compare/v1.0.0-alpha.6...v1.0.0-alpha.7) (2021-10-31)


### Performance Improvements

* improve variants performance ([47703a0](https://github.com/dash-ui/styles/commit/47703a0e329eda4f527c0bbb87afa59f36453364))

# [1.0.0-alpha.6](https://github.com/dash-ui/styles/compare/v1.0.0-alpha.5...v1.0.0-alpha.6) (2021-10-31)


### Bug Fixes

* fix handling of numeric variants ([dce553b](https://github.com/dash-ui/styles/commit/dce553b31635b3f7355e1fb6d44d3b83ca2c0c68))

# [1.0.0-alpha.5](https://github.com/dash-ui/styles/compare/v1.0.0-alpha.4...v1.0.0-alpha.5) (2021-10-30)


### Bug Fixes

* fix missing number variant types ([bf6b466](https://github.com/dash-ui/styles/commit/bf6b466d01d4cca98bbdc5bd2d18bc5c787a35e2))

# [1.0.0-alpha.4](https://github.com/dash-ui/styles/compare/v1.0.0-alpha.3...v1.0.0-alpha.4) (2021-10-30)


### Bug Fixes

* allow style map to have numeric keys ([ad16a2b](https://github.com/dash-ui/styles/commit/ad16a2b90aa5727f1a2d5c834255a2302405b15a))

# [1.0.0-alpha.3](https://github.com/dash-ui/styles/compare/v1.0.0-alpha.2...v1.0.0-alpha.3) (2021-10-29)


### Bug Fixes

* simplify token union type ([3e1fad4](https://github.com/dash-ui/styles/commit/3e1fad4d17b8d42d9402fdc1874b6e5680e2cc55))

# [1.0.0-alpha.2](https://github.com/dash-ui/styles/compare/v1.0.0-alpha.1...v1.0.0-alpha.2) (2021-10-29)


### Bug Fixes

* stop freezing tokens ([afe70b6](https://github.com/dash-ui/styles/commit/afe70b64d91fcb77652dc7545e13b3069b7d6088))

# [1.0.0-alpha.1](https://github.com/dash-ui/styles/compare/v0.8.9...v1.0.0-alpha.1) (2021-10-28)


### Bug Fixes

* add prerelease properties to semantic release branches ([7e6e567](https://github.com/dash-ui/styles/commit/7e6e567397ebab931d407de8d5e14001fc171104))


### chore

* move next to alpha ([#18](https://github.com/dash-ui/styles/issues/18)) ([497f2eb](https://github.com/dash-ui/styles/commit/497f2eba676660af441931768e235491d6790497)), closes [#17](https://github.com/dash-ui/styles/issues/17) [#17](https://github.com/dash-ui/styles/issues/17)


### Code Refactoring

* add a variants property and make styles an object ([0348d95](https://github.com/dash-ui/styles/commit/0348d95b9dabd7c84df1919a8fc3e39669dc6df2))


### BREAKING CHANGES

* createStyles() no longer returns a function, it returns an object.
* This will break things that depend on the previous type definitions

* chore(release): 1.0.0

# [1.0.0](https://github.com/dash-ui/styles/compare/v0.8.9...v1.0.0) (2021-10-28)

### Code Refactoring

# [1.0.0](https://github.com/dash-ui/styles/compare/v0.8.9...v1.0.0) (2021-10-28)


### chore

* move next to alpha ([#18](https://github.com/dash-ui/styles/issues/18)) ([497f2eb](https://github.com/dash-ui/styles/commit/497f2eba676660af441931768e235491d6790497)), closes [#17](https://github.com/dash-ui/styles/issues/17) [#17](https://github.com/dash-ui/styles/issues/17)


### Code Refactoring

* add a variants property and make styles an object ([0348d95](https://github.com/dash-ui/styles/commit/0348d95b9dabd7c84df1919a8fc3e39669dc6df2))


### BREAKING CHANGES

* createStyles() no longer returns a function, it returns an object.
* This will break things that depend on the previous type definitions

* chore(release): 1.0.0

# [1.0.0](https://github.com/dash-ui/styles/compare/v0.8.9...v1.0.0) (2021-10-28)

### Code Refactoring

# [1.0.0](https://github.com/dash-ui/styles/compare/v0.8.9...v1.0.0) (2021-10-28)


### Code Refactoring

* improve typing ([#17](https://github.com/dash-ui/styles/issues/17)) ([9b4f1b1](https://github.com/dash-ui/styles/commit/9b4f1b1d98ec40c815ac1b4a5e185dee2cd14cb6))


### BREAKING CHANGES

* This will break things that depend on the previous type definitions

## [0.8.9](https://github.com/dash-ui/styles/compare/v0.8.8...v0.8.9) (2021-10-03)


### Performance Improvements

* improve lazy evaluation performance ([31a7fa9](https://github.com/dash-ui/styles/commit/31a7fa9a3fbbe3650f2db0dfa1856a18888c681e))

## [0.8.8](https://github.com/dash-ui/styles/compare/v0.8.7...v0.8.8) (2021-09-27)


### Bug Fixes

* fix esm output ([5b8ac4d](https://github.com/dash-ui/styles/commit/5b8ac4dba73ce6ae0a54d3ed43da1682d961071c))

## [0.8.7](https://github.com/dash-ui/styles/compare/v0.8.6...v0.8.7) (2021-09-27)


### Performance Improvements

* improve cold start performance ([#16](https://github.com/dash-ui/styles/issues/16)) ([215f234](https://github.com/dash-ui/styles/commit/215f234f96394bd248bbe2d931fe75af5a673160))

### [0.8.6](https://github.com/dash-ui/styles/compare/v0.8.5...v0.8.6) (2020-08-08)

### Features

- **styles:** return empty string from css() when first argument falsy ([e7628b3](https://github.com/dash-ui/styles/commit/e7628b32a51ec3874c84e3962f3344a05f0a2ae4))

### [0.8.5](https://github.com/dash-ui/styles/compare/v0.8.4...v0.8.5) (2020-08-08)

### [0.8.4](https://github.com/dash-ui/styles/compare/v0.8.3...v0.8.4) (2020-08-08)

### Features

- **styles:** add lazy styles ([f963a84](https://github.com/dash-ui/styles/commit/f963a849d4848278a58283aa8a2300bf97818cec))

### [0.8.3](https://github.com/dash-ui/styles/compare/v0.8.2...v0.8.3) (2020-08-07)

### Bug Fixes

- fix inadvertent style call ([1648bc4](https://github.com/dash-ui/styles/commit/1648bc40dd9e96ef1de579f3732b82d5011a80fb))

### [0.8.2](https://github.com/dash-ui/styles/compare/v0.8.1...v0.8.2) (2020-08-07)

### Features

- **types:** improve style object autocompletion ([d6d1dab](https://github.com/dash-ui/styles/commit/d6d1dab0bb1ec111b244b3dd78cb58bb88c7ab4c))

### [0.8.1](https://github.com/dash-ui/styles/compare/v0.8.0...v0.8.1) (2020-07-29)

### Bug Fixes

- **styles:** fix tokens type ([139b63c](https://github.com/dash-ui/styles/commit/139b63c65ab2ac8b506abf135fab4e033df22da2))

## [0.8.0](https://github.com/dash-ui/styles/compare/v0.7.3...v0.8.0) (2020-07-27)

### ⚠ BREAKING CHANGES

- **styles:** All instances of "variables" in the API was renamed to "tokens", all instances of
  "Variables" was renamed to "Tokens"

- **styles:** rename all instances of "variables" to "tokens" ([b9c7577](https://github.com/dash-ui/styles/commit/b9c7577825549918cf2c09a2479c8c86d86a6502))

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
