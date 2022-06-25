<hr>
  <img src='https://github.com/dash-ui/styles/raw/main/assets/logo.png'/>
  
  > A tiny, powerful, framework-agnostic CSS-in-JS library

```sh
npm i @dash-ui/styles
```

  <p>
    <a href="https://bundlephobia.com/result?p=@dash-ui/styles">
      <img alt="Bundlephobia" src="https://img.shields.io/bundlephobia/minzip/@dash-ui/styles?style=for-the-badge&labelColor=24292e">
    </a>
    <a aria-label="Types" href="https://www.npmjs.com/package/@dash-ui/styles">
      <img alt="Types" src="https://img.shields.io/npm/types/@dash-ui/styles?style=for-the-badge&labelColor=24292e">
    </a>
    <a aria-label="Code coverage report" href="https://codecov.io/gh/dash-ui/styles">
      <img alt="Code coverage" src="https://img.shields.io/codecov/c/gh/dash-ui/styles?style=for-the-badge&labelColor=24292e">
    </a>
    <a aria-label="Build status" href="https://github.com/dash-ui/styles/actions/workflows/release.yml">
      <img alt="Build status" src="https://img.shields.io/github/workflow/status/dash-ui/styles/release/main?style=for-the-badge&labelColor=24292e">
    </a>
    <a aria-label="NPM version" href="https://www.npmjs.com/package/@dash-ui/styles">
      <img alt="NPM Version" src="https://img.shields.io/npm/v/@dash-ui/styles?style=for-the-badge&labelColor=24292e">
    </a>
    <a aria-label="License" href="https://jaredlunde.mit-license.org/">
      <img alt="MIT License" src="https://img.shields.io/npm/l/@dash-ui/styles?style=for-the-badge&labelColor=24292e">
    </a>

  </p>

---

## Features

- [x] **Tiny** ([< 6kB](https://bundlephobia.com/result?p=@dash-ui/styles@latest)), but
      comprehensive api
- [x] **Bring your own UI framework** React, Preact, Vue, Svelte, etc.
- [x] **Strongly typed** with TypeScript
- [x] **CSS variables** are a first-class citizen
- [x] **Themes** are easy and built with design tokens (CSS variables) and selectors
- [x] **_Fast_**, some may say blazing™
- [x] **Autoprefixing** for vendor-specific styles
- [x] **Nesting** `div { > * + * { margin-left: 4px; } }`
- [x] **Minification**
- [x] **Server rendering** [made easy](#server-rendering)
- [x] **Flushable globals** make adding and removing global styles a breeze
- [x] **Available as a [UMD](https://unpkg.com/browse/@dash-ui/styles@latest/dist/umd/) and [ES Module](https://cdn.skypack.dev/@dash-ui/styles/)**

## Quick start

[Check out an example on **CodeSandbox**](https://codesandbox.io/s/dash-ui-react-example-029p5)

```jsx harmony
// React example
import * as React from "react";
import { styles } from "@dash-ui/styles";

// Any global styles or tokens that are inserted into the DOM
// can be easily ejected by calling the function they return.
const flushTokens = styles.insertTokens({
  color: {
    // var(--color-brand)
    brand: "#ee5b5f",
    // var(--color-white)
    white: "#fafafa",
  },
  elevation: {
    // var(--elevation-resting)
    resting:
      "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
  },
  radius: {
    // var(--radius-primary)
    primary: "4px",
  },
});

const flushGlobal = styles.insertGlobal`
  body {
    min-height: 100vh;
  }
`;

// `styles` is a function for composing style variants in a
// deterministic way. In the example below, you'll see an example
// of a button with default styles and two variants: one for a
// 'brand' background color and one for a 'black' background color.
const button = styles.variants({
  // The object in this callback is a mapping to the CSS
  // tokens above. `default` here is a special style name
  // that will be applied to each invocation of `button()`
  default: ({ radius }) => `
    display: inline-block;
    border: none;
    background: transparent;
    padding: 0.5rem 1rem;
    font-weight: 700;
    border-radius: ${radius.primary};
    box-shadow: ${elevation.resting};
    color: ${color.white};
    
    /**
     * Dash uses a CSS preprocessor called stylis so nesting,
     * autoprefixing, etc. come out of the box.
     * https://www.npmjs.com/package/stylis
     */
    :active {
      transform: translateY(1px);
    }
  `,
  // Styles can also be defined in the object format
  brand: ({ color }) => ({
    backgroundColor: color.brand,
  }),
  // Lastly, styles need not use callbacks if they don't need
  // access to design tokens
  black: {
    backgroundColor: "#000",
  },
});

const Component = (props) => (
  <div>
    {/**
     * Styles are composed in the order they're defined in arguments,
     * so they are completely deterministic.
     */}
    <button className={button("solid", "brand")}>Solid brand</button>
    {/**
     * That is, in the button below `black`'s background color will
     * take precendence over the `brand` background color.
     */}
    <button className={button({ outline: true, brand: true, black: true })}>
      Solid black
    </button>
  </div>
);
```

## API docs

### Creating styles

|                                                   | Description                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`styles.variants()`](#stylesvariants)            | `styles.variants()` is a function for composing style variants in a deterministic way. It returns a function which when called will insert your styles into the DOM and create a unique class name.                                                                                                                                                   |
| [`styles.one()`](#stylesone)                      | A function that accepts a tagged template literal, style object, or style callback, and returns a function. That function inserts the style into a `<style>` tag and returns a class name when called.                                                                                                                                                |
| [`styles.cls()`](#stylescls)                      | A function that accepts a tagged template literal, style object, or style callback. Calling this will immediately insert the CSS into the DOM and return a unique class name for the styles. This is a shortcut for `styles.one({display: 'flex'})()`.                                                                                                |
| [`styles.lazy()`](#styleslazy)                    | A function that uses lazy evalution to create styles with indeterminate values. Calling this will immediately insert the CSS into the DOM and return a unique class name for the styles.                                                                                                                                                              |
| [`styles.join()`](#stylesjoin)                    | A function that joins CSS strings, inserts them into the DOM right away, and returns a class name.                                                                                                                                                                                                                                                    |
| [`styles.keyframes()`](#styleskeyframes)          | A function that accepts a tagged template literal, style object, or style callback. Using this will immediately insert a global `@keyframes` definition into the DOM and return the name of the keyframes instance.                                                                                                                                   |
| [`styles.theme()`](#stylestheme)                  | A function that returns the generated class name for a given theme when using [`styles.insertThemes()`](#stylesinsertthemes) to create CSS variable-based themes.                                                                                                                                                                                     |
| [`styles.insertThemes()`](#stylesinsertthemes)    | This creates a CSS variable-based theme by defining tokens within a class name selector matching the theme name. Apart from that it works the same way [`styles.insertTokens()`](#stylesinserttokens) does. This function returns a function that will flush the styles inserted by [`styles.insertTokens()`](#stylesinserttokens) when it is called. |
| [`styles.insertTokens()`](#stylesinserttokens)    | Inserts design tokens into the DOM and makes them available for use in style callbacks. The name of the design tokens is automatically generated based upon the depth of the mapping i.e. `foo.bar.baz` -> `--foo-bar-baz`. This function returns a function that will flush the tokens that were inserted when it is called.                         |
| [`styles.insertGlobal()`](#stylesoneinsertglobal) | A function that accepts a tagged template literal, style object, or style callback. Using this will immediately insert styles into the DOM relative to the root document. This function returns a function that will flush the styles inserted when it is called.                                                                                     |
| [`styles.hash()`](#styleshash)                    | The hashing function used for creating unique selector names.                                                                                                                                                                                                                                                                                         |
| [`styles.tokens`](#stylestokens)                  | The design tokens configured in the instance.                                                                                                                                                                                                                                                                                                         |
| [`styles.dash`](#stylesdash)                      | The instance of underlying the Dash cache used by this instance. This was automatically created by [`createDash()`](#createdash) when [`createStyles()`](#createstyles) was called. Dash controls the caching, style sheets, auto-prefixing, and DOM insertion that happens in the [`styles.variants()`](#stylesvariants) instance.                   |

### Server rendering

Dash has robust server rendering utilities out of the box. If you're using React, there
are even more helpers available for Gatsby, Next.js, etc. available in
[`@dash-ui/react`](https://github.com/dash-ui/react).

|                                                           | Description                                                                                                                                                                                                                                                                                                                                                                                                             |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`createStylesFromCache()`](#createstylesfromcache)       | Creates a string of CSS based on the dash `inserted` cache. This is an extremely fast way to generate a CSS string. It returns an object containing the hash names of all of the styles used as well as the CSS string. Note that this function is unsafe in asynchronous render environments because multiple pages using the same cache will dirty the results. This means it will not work with Gatsby, for example. |
| [`createStyleTagFromCache()`](#createstyletagfromcache)   | Creates a `<style>` tag w/ CSS based on the dash `inserted` cache. This is an extremely fast way to generate a `<style>` tag. Note that this function is unsafe in asynchronous render environments because multiple pages using the same cache will dirty the results. This means it will not work with Gatsby, for example.                                                                                           |
| [`writeStylesFromCache()`](#writestylesfromcache)         | Writes a CSS to a file based on the dash `inserted` cache. This is an extremely fast way to generate a CSS file. Note that this function is unsafe in asynchronous render environments because multiple pages using the same cache will dirty the results. This means it will not work with Gatsby, for example.                                                                                                        |
| [`createStylesFromString()`](#createstylesfromstring)     | Creates a string of CSS based on an HTML string. This function will parse your HTML output for Dash class names and pull the styles associated with them from the Dash cache. It returns an object containing the hash names of all of the styles used as well as the CSS string. This is a safe way to generate style strings in an asynchronous environment.                                                          |
| [`createStyleTagFromString()`](#createstyletagfromstring) | Creates a `<style>` tag w/ CSS based on an HTML string. This function will parse your HTML output for Dash class names and pull the styles associated with them from the Dash cache. This is a safe way to generate `<style>` tags in an asynchronous environment.                                                                                                                                                      |
| [`writeStylesFromString()`](#writestylesfromstring)       | Writes a CSS to a file based on an HTML string. This function will parse your HTML output for Dash class names and pull the styles associated with them from the Dash cache. This is a safe way to generate CSS files in an asynchronous environment.                                                                                                                                                                   |

### Creating a custom `styles` instance

|                                   | Description                                                                                     |
| --------------------------------- | ----------------------------------------------------------------------------------------------- |
| [`createStyles()`](#createstyles) | A factory function that returns a new `styles` instance with your custom configuration options. |
| [`createDash()`](#createdash)     | Dash is a tiny, performant CSS-in-JS style rule sheet manager similar to Emotion.               |

### Utilities

|                                     | Description                                                                                                                                                                                                                                                                                     |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`compileStyles()`](#compilestyles) | A utility function that will compile style objects and callbacks into CSS strings.                                                                                                                                                                                                              |
| [`hash()`](#hash)                   | An FNV-1a hashing algorithm with a 32-bit offset basis. FNV-1a hashes are designed to be fast while maintaining a low collision rate. The high dispersion rate makes them well-suited for hashing nearly identical strings. This is the default hash used by [`createStyles()`](#createstyles). |

### TypeScript support

Dash is written in TypeScript. It's also strongly typed, creating a beautiful IntelliSense
experience in VSCode and providing solid insurance to your TypeScript application.

|                                                 | Description                                                                |
| ----------------------------------------------- | -------------------------------------------------------------------------- |
| [Strongly typed tokens](#strongly-typed-tokens) | Learn how to add autocomplete and type safety to your design tokens.       |
| [Strongly typed themes](#strongly-typed-tokens) | Learn how to add autocomplete and type safety to your CSS variable themes. |

## Awesome @dash-ui libraries

Write something awesome for Dash, [tell me about it](https://twitter.com/jaredLunde), and
I will put it here.

|                                                                           | Description                                                                                                                                                                 |
| ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`@dash-ui/layout`](https://github.com/dash-ui/layout#readme)             | Framework-agnostic layout primitives for [@dash-ui](https://github.com/dash-ui).                                                                                            |
| [`@dash-ui/jest`](https://github.com/dash-ui/jest#readme)                 | The easiest way to test React, Preact, and Preact X components with [@dash-ui](https://github.com/dash-ui). This includes snapshot serialization and a custom Jest matcher. |
| [`@dash-ui/react`](https://github.com/dash-ui/react#readme)               | React components and hooks for [@dash-ui](https://github.com/dash-ui).                                                                                                      |
| [`@dash-ui/react-layout`](https://github.com/dash-ui/react-layout#readme) | Layout primitives for React and [@dash-ui](https://github.com/dash-ui), including Box, Cluster, Grid, Row, Column, and Layer.                                               |
| [`@dash-ui/mq`](https://github.com/dash-ui/mq#readme)                     | A utility function for adding stored media queries and breakpoints to [@dash-ui](https://github.com/dash-ui) styles.                                                        |
| [`@dash-ui/transition`](https://github.com/dash-ui/transition#readme)     | A library for creating performant and composable CSS transitions with [@dash-ui](https://github.com/dash-ui).                                                               |

## Why does this exist?

In the days before Emotion was subsumed by the React community and
[effectively ruined](https://github.com/emotion-js/emotion/issues/1059), there existed a beautiful,
simple CSS-in-JS API. It returned class names instead of objects. It was easy to use. It didn't require
a babel plugin or a JSX pragma. It wasn't inextricably tied to React or React context trees.

About a year after I created that Emotion issue, I started work on Dash. I've worked tirelessly
since to create a library I genuinely liked using. I wanted to create a library that combined the
simplicity of CSS with the versatility of JavaScript - as CSS-in-JS has always intended.

Dash can be used in React, but doesn't rely on it. It can also be used in Vue, Svelte, and
anywhere else you can use JavaScript. Themes are created with CSS variables and selectors,
not React context.

I hope you'll give it a chance.

---

### styles.variants()

`styles.variants()` is a function for composing style variants in a deterministic way. It returns a
function which when called will insert your styles into the DOM and create a unique class name.

#### Example

[Play with an example on **CodeSandbox**](https://codesandbox.io/s/dash-uistyles-styles-example-slp3z?file=/src/App.tsx)

```jsx harmony
// React example
import * as React from "react";
import { styles } from "@dash-ui/styles";

const button = styles.variants({
  // The object in this callback is a mapping to the CSS
  // tokens above. `default` here is a special style name
  // that will be applied to each invocation of `button()`
  default: ({ radius }) => `
    display: inline-block;
    border: none;
    background: transparent;
    padding: 0.5rem 1rem;
    font-weight: 700;
    border-radius: ${radius.primary};
    box-shadow: ${elevation.resting};

    :active {
      transform: translateY(1px);
    }
  `,
  // Styles can also be defined in the object format
  primary: ({ color }) => ({
    backgroundColor: color.primary,
    color: color.white,
  }),
  // Lastly, styles need not use callbacks if they don't need
  // access to design tokens
  black: {
    backgroundColor: "#000",
    color: "#fff",
  },
});

const Component = (props) => (
  <React.Fragment>
    {/**
     * Styles are composed in the order they're defined in arguments,
     * so they are completely deterministic. Calling the `button`
     * function returns a string class name.
     */}
    <button className={button("solid", "brand")}>Solid brand</button>
    {/**
     * That is, in the button below `black`'s background color will
     * take precendence over the `brand` background color because it
     * is declared after `brand`.
     */}
    <button className={button({ outline: true, brand: true, black: true })}>
      Solid black
    </button>
  </React.Fragment>
);
```

#### Arguments

```typescript
styles<N extends string>(styleMap: StyleMap<N, V>): Style<N, V>
```

| Argument | Type                    | Required? | Description             |
| -------- | ----------------------- | --------- | ----------------------- |
| styleMap | [`StyleMap`](#stylemap) | Yes       | A key/CSS value mapping |

#### Returns

```ts
/**
 * A function that inserts styles from the style map into the DOM when called
 * with those style names selected.
 *
 * @param args A series of style names or style name/boolean maps which
 *  select the styles from the style map you want to compose into a singular
 *  deterministic style and class name.
 */
export type Style<N extends string, V extends DashTokens = DashTokens> = {
  (...args: StyleArguments<N>): string;
  /**
   * A function that returns the raw, CSS string for a given
   * name in the style map.
   *
   * @param names A series of style names or style name/boolean maps which
   *  select the styles from the style map you want to compose into a singular
   *  CSS string.
   */
  css(...names: StyleArguments<N>): string;
  /**
   * The style map that this `style()` instance was instantiated with.
   */
  styles: StyleMap<N, V>;
};

export type StyleArguments<N extends string> = (
  | N
  | {
      [Name in N]?: boolean | null | undefined | string | number;
    }
  | Falsy
)[];
```

### StyleMap

```ts
export type StyleMap<N extends string, V extends DashTokens = DashTokens> = {
  [Name in N | "default"]?: StyleValue<V>;
};

export type StyleValue<V extends DashTokens = DashTokens> =
  | string
  | StyleCallback<V>
  | StyleObject;

export type StyleObject = {
  [property: string]: StyleObject | string | number;
};

export type StyleCallback<V extends DashTokens = DashTokens> = (
  tokens: V
) => StyleObject | string;
```

---

### styles.one()

A function that accepts a tagged template literal, style object, or style callback, and
returns a function. That function inserts the style into a `<style>` tag and returns a
class name when called.

#### Example

[Play with an example on **CodeSandbox**](https://codesandbox.io/s/dash-uistyles-stylesone-example-0mq1t?file=/src/App.tsx)

```jsx harmony
// React example
import * as React from "react";
import { styles } from "@dash-ui/styles";

// Can be a tagged template literal
const heading = styles.one`
  font-size: 2rem;
  font-weight: bold;
`;

// Or an object
const heading = styles.one({
  fontSize: "2rem",
  fontWeight: "bold",
});

// Or a callback
const heading = styles.one(({ font }) => ({
  fontSize: font.size.heading,
  fontWeight: "bold",
}));

const Heading = () => <h1 className={heading()}>Hello world</h1>;
```

#### Returns

```ts
/**
 * A function that inserts styles into the DOM when called without
 * a falsy value. If the first argument is falsy, the styles will
 * not be inserted and a class name will not be returned.
 */
export type StylesOne = {
  (createClassName?: boolean | number | string | null): string;
  /**
   * A method that returns a CSS string if the first argument is not falsy.
   */
  css(createCss?: boolean | number | string | null): string;
};
```

---

### styles.cls()

A function that accepts a tagged template literal, style object, or style callback.
Calling this will immediately insert the CSS into the DOM and return a unique class
name for the styles. This is a shortcut for `styles.one({display: 'flex'})()`.

#### Example

[Play with an example on **CodeSandbox**](https://codesandbox.io/s/dash-uistyles-stylescls-example-vffy5?file=/src/App.tsx)

```jsx harmony
// React example
import * as React from "react";
import { styles } from "@dash-ui/styles";

// The styles here will only be injected into the DOM
// immediately when the style is created. This is cached
// so it will only happen on the first call. Any
// subsequent calls merely return a class name.
const Box = () => (
  <div
    className={styles.cls(
      ({ color }) => `
        width: 200px;
        height: 200px;
        background-color: ${color.primary};

        :hover {
          background-color: ${color.secondary};
        }
      `
    )}
  />
);
```

#### Returns

```ts
string; // A class name
```

---

### styles.lazy()

A function that uses lazy evalution to create styles with indeterminate values.
Calling this will immediately insert the CSS into the DOM and return a unique
class name for the styles.

#### Example

[Play with an example on **CodeSandbox**](https://codesandbox.io/s/dash-uistyles-styleslazy-example-7kymy?file=/src/App.tsx)

```jsx harmony
// React example
import * as React from "react";
import clsx from "clsx";
import { styles } from "@dash-ui/styles";

// The lazy function can return style objects, style callbacks,
// and strings
const bgColor = styles.lazy((colorName) => ({ color }) => ({
  backgroundColor: color[colorName],
}));

const Box = ({ bg = "primary" }) => <div className={bgColor(bg)} />;
```

#### Returns

```ts
/**
 * A function that inserts indeterminate styles based on the value
 * into the DOM when called.
 *
 * @param value A JSON serializable value to create indeterminate
 *   styles from
 */
export type StylesLazy<Value extends LazyValue> = {
  (value?: Value): string;
  /**
   * A method that returns indeterminate CSS strings based on the value
   * when called.
   *
   * @param value A JSON serializable value to create indeterminate
   *   styles from
   */
  css(value?: Value): string;
};
```

---

### styles.join()

A function that joins CSS strings, inserts them into the DOM right away, and returns a
class name.

#### Example

[Play with an example on **CodeSandbox**](https://codesandbox.io/s/dash-uistyles-stylesjoin-example-t7jft?file=/src/App.tsx)

```jsx harmony
// React example
import * as React from "react";
import { styles } from "@dash-ui/styles";

// Create a style for primary bg color
const bgPrimary = styles.one(
  ({ color }) => `
    background-color: ${color.primary};
  `
);

// Creates styles for a box with 2 widths
const box = styles.variants({
  default: {
    width: 200,
    height: 200,
  },
  big: {
    width: 400,
    height: 400,
  },
});

// This joins CSS strings together and immediately
// inserts them into the DOM while returning a
// class name
const PrimaryBox = () => (
  <div className={styles.join(bgPrimary.css(), box.css("big"))} />
);
```

#### Arguments

```ts
styles.join(...css: string[]): string
```

| Argument | Type       | Required? | Description                                                |
| -------- | ---------- | --------- | ---------------------------------------------------------- |
| ...css   | `string[]` | Yes       | One or several CSS strings you want to join into one style |

#### Returns

```ts
string; // A class name
```

---

### styles.keyframes()

A function that accepts a tagged template literal, style object, or style callback.
Invoking it will immediately inject its styles into the DOM and return an animation
name which can then be referenced in other styles.

#### Example

[Play with an example on **CodeSandbox**](https://codesandbox.io/s/dash-uistyles-styleskeyframes-example-kuk2o?file=/src/App.tsx)

```jsx harmony
// React example
import * as React from "react";
import { styles } from "@dash-ui/styles";

// Immediately injects keyframes styles into the
// DOM and returns an animation name which can then
// be referenced in other styles.
const zoomy = styles.keyframes`
  0% {
    transform: scale(0.0);
  }

  60% {
    transform: scale(1.4);
  }

  80% {
    transform: scale(1);
  }

  100% {
    transform: scale(0.0);
  }
`;

// Creates styles for a zoomy box
const zoomyBox = styles.one({
  animationName: zoomy,
  animationDuration: `2000ms`,
  animationIterationCount: "infinite",
  backgroundColor: "#008489",
  width: 100,
  height: 100,
  margin: "48px auto",
});

const ZoomyBox = () => <div className={zoomyBox()} />;
```

#### Returns

```ts
string; // An animation name
```

---

### styles.theme()

A function that returns the generated class name for a given theme when using
[`styles.insertThemes()`](#stylesinsertthemes) to create CSS variable-based themes.

#### Example

[Play with an example on **CodeSandbox**](https://codesandbox.io/s/dash-uistyles-stylestheme-example-58n8z?file=/src/App.tsx:0-1368)

```tsx
// React example
import * as React from "react";
import { createStyles } from "@dash-ui/styles";

// Creating our own styles instance gives us strong
// types for `themes` and `tokens` without having
// to declare DashTokens and DashThemes types in
// our app
const styles = createStyles({
  themes: {
    // Light mode design tokens
    light: {
      bgColor: "#FAFAFA",
      primaryColor: "#ee5b5f",
    },
    // Dark mode design tokens
    dark: {
      bgColor: "#272727",
      primaryColor: "#333",
    },
  } as const,
});

export const App = () => {
  const [mode, setMode] = React.useState<"light" | "dark">("light");

  React.useEffect(() =>
    styles.insertGlobal(({ bgColor }) => ({
      body: { backgroundColor: bgColor },
    }))
  );

  return (
    // Sets the theme name on the body element
    // The theme class name is what determines
    // which CSS variable values take precedence
    // in the cascade
    <body className={styles.theme(mode)}>
      <div
        className={styles.cls(
          ({ bgColor, primaryColor }) => `
            width: 200px;
            height: 200px;
            background-color: ${primaryColor};
          `
        )}
      />

      <button
        onClick={() => setMode((mode) => (mode === "light" ? "dark" : "light"))}
      >
        Switch to {mode === "light" ? "dark" : "light"} mode
      </button>
    </body>
  );
};
```

#### Arguments

```typescript
theme(name: T): string
```

| Argument | Type     | Required? | Description           |
| -------- | -------- | --------- | --------------------- |
| name     | `string` | Yes       | The name of the theme |

#### Returns

```typescript
string; // A class name
```

---

### styles.insertThemes()

This creates a CSS variable-based theme by defining tokens within a class name selector
matching the theme name. Apart from that it works the same way
[`styles.insertTokens()`](#stylesinserttokens) does. This function returns a
function that will flush the styles inserted by [`styles.insertTokens()`](#stylesinserttokens)
when it is called.

#### Example

[Play with an example on **CodeSandbox**](https://codesandbox.io/s/dash-uistyles-stylesinsertthemes-example-6ohbd?file=/src/App.tsx)

```tsx
// React example
import * as React from "react";
import { createStyles } from "@dash-ui/styles";

// Creating our own styles instance gives us strong
// types for `themes` and `tokens` without having
// to declare DashTokens and DashThemes types in
// our app
const styles = createStyles({
  themes: {
    // Light mode design tokens
    light: {
      primaryColor: "#ee5b5f",
    },
    // Dark mode design tokens
    dark: {
      primaryColor: "#272727",
    },
  },
});

export const App = () => {
  const [mode, setMode] = React.useState<"light" | "dark">("light");
  const [darkModePrimary, setDarkModePrimary] = React.useState("#272727");
  const [lightModePrimary, setLightModePrimary] = React.useState("#ee5b5f");

  React.useEffect(
    // Here we are updating our theme values each
    // time they change for a given mode.
    () =>
      styles.insertThemes({
        light: {
          primaryColor: lightModePrimary,
        },
        dark: {
          primaryColor: darkModePrimary,
        },
      }),
    [darkModePrimary, lightModePrimary]
  );

  return (
    // Sets the theme name on the body element
    // The theme class name is what determines
    // which CSS variable values take precedence
    // in the cascade
    <body className={styles.theme(mode)}>
      <div
        className={styles.cls(
          ({ primaryColor }) => `
            width: 200px;
            height: 200px;
            background-color: ${primaryColor};
          `
        )}
      />

      <div>
        <button
          onClick={() =>
            setMode((mode) => (mode === "light" ? "dark" : "light"))
          }
        >
          Switch to {mode === "light" ? "dark" : "light"} mode
        </button>
      </div>

      <label>
        <h4>Light mode primary color</h4>
        <input
          value={lightModePrimary}
          onChange={(e) => setLightModePrimary(e.target.value)}
        />
      </label>

      <label>
        <h4>Dark mode primary color</h4>
        <input
          value={darkModePrimary}
          onChange={(e) => setDarkModePrimary(e.target.value)}
        />
      </label>
    </body>
  );
};
```

#### Arguments

```typescript
insertThemes(
    themes: DeepPartial<
      {
        [Name in DashThemeNames]: DashTokens
      }
    >
  ): () => void
```

| Argument | Type                                                  | Required? | Description                                 |
| -------- | ----------------------------------------------------- | --------- | ------------------------------------------- |
| themes   | `DeepPartial<{[Name in DashThemeNames]: DashTokens}>` | Yes       | A mapping of theme name/CSS variable pairs. |

#### Returns

```typescript
// A function that flushes the style sheet created by
// inserting the new variable values when invoked
() => void
```

---

### styles.insertTokens()

Inserts design tokens into the DOM and makes them available for use in style callbacks. The
name of the design tokens is automatically generated based upon the depth of the mapping
i.e. `foo.bar.baz` -> `--foo-bar-baz`. This function returns a function that will flush
the tokens that were inserted when it is called.

#### Example

[Play with an example on **CodeSandbox**](https://codesandbox.io/s/dash-uistyles-stylesinserttokens-example-orsif?file=/src/App.tsx)

```tsx
// React example
import * as React from "react";
import { createStyles } from "@dash-ui/styles";

// Creating our own styles instance gives us strong
// types for `tokens` without having to declare
// DashTokens in our app
const styles = createStyles({
  tokens: {
    primaryColor: "#ee5b5f",
  },
});

export const App = () => {
  const [primaryColor, setPrimaryColor] = React.useState("#ee5b5f");

  React.useEffect(
    // Here we are updating our variable values each
    // time they change.
    () =>
      styles.insertTokens({
        primaryColor,
      }),
    [primaryColor]
  );

  return (
    <div>
      <div
        className={styles.cls(
          ({ primaryColor }) => `
            width: 200px;
            height: 200px;
            background-color: ${primaryColor};
          `
        )}
      />

      <label>
        <h4>Primary color</h4>
        <input
          value={primaryColor}
          onChange={(e) => setPrimaryColor(e.target.value)}
        />
      </label>
    </div>
  );
};
```

#### Arguments

```typescript
insertTokens(tokens: DeepPartial<DashTokens>, selector?: string): () => void
```

| Argument | Type                      | Required? | Default   | Description                                                                                                                  |
| -------- | ------------------------- | --------- | --------- | ---------------------------------------------------------------------------------------------------------------------------- |
| tokens   | `DeepPartial<DashTokens>` | Yes       |           | A map of CSS variable name/value pairs                                                                                       |
| selector | `string`                  | No        | `":root"` | Including a selector will only make these CSS variable definitions take effect within the selector, e.g. a class name or ID. |

#### Returns

```typescript
// A function that flushes the style sheet created by
// inserting the new variable values when invoked
() => void
```

---

### styles.insertGlobal()

A function that accepts a tagged template literal, style object, or style callback. Using
this will immediately insert styles into the DOM relative to the root document. This function
returns a function that will flush the styles inserted when it is called.

#### Example

[Play with an example on **CodeSandbox**](https://codesandbox.io/s/dash-uistyles-stylesinsertglobal-example-on4jz?file=/src/App.tsx)

```tsx
// React example
import * as React from "react";
import { styles } from "@dash-ui/styles";

const flushStyles = styles.insertGlobal({
  body: {
    minHeight: "100vh",
    backgroundColor: "#ee5b5f",
    color: "#fff",
    fontFamily: "Inter, -apple-system, sans-serif",
  },
  h1: {
    margin: "1rem",
    fontSize: "3rem",
  },
});

export const App = () => {
  return (
    <div>
      <h1>Hello world</h1>
      <button onClick={flushStyles}>Flush styles</button>
    </div>
  );
};
```

#### Returns

```typescript
// A function that flushes the style sheet created when
// inserting the new global styles
() => void
```

---

### styles.hash()

The hashing function used for creating unique selector names. This can be
configured by creating your own `styles` instance with [`createStyles()`](#createstyles).

#### Example

```js
import { styles } from "@dash-ui/styles";

console.log(styles.hash("foo: bar;"));
// 1rcc4tl
```

#### Arguments

```typescript
hash(string: string): string
```

| Argument | Type     | Required? | Description                   |
| -------- | -------- | --------- | ----------------------------- |
| string   | `string` | Yes       | The string you'd like to hash |

#### Returns

```typescript
string; // A hash of the input string
```

---

### styles.tokens

The design tokens configured in the instance

#### Example

```js
import {styles} from '@dash-ui/styles`

styles.insertTokens({foo: 'bar'})
console.log(styles.tokens)
// {foo: 'var(--foo)'}
```

---

### styles.dash

The instance of underlying the Dash cache used by this instance. This was automatically
created by [`createDash()`](#createdash) when [`createStyles()`](#createstyles) was called.
Dash controls the caching, style sheets, auto-prefixing, and DOM insertion that happens
in the `styles` instance.

#### Example

```jsx harmony
import { styles } from "@dash-ui/styles";
// Inserts a style named 'foo' under the selector '.foo'
// into the default style sheet
styles.dash.insert("foo", ".foo", "display: flex;");
```

---

### createStyles()

A factory function that returns a new `styles` instance with your custom configuration options.
I would suggest that you almost always create your own `styles` instance - especially when
using TypeScript.

#### Example

```js
import {createStyles, createDash} from '@dash-ui/styles`

const styles = createStyles({
  dash: createDash({key: 'css', prefix: false}),
  mangleTokens: typeof process !== 'undefined' && process.env.NODE_ENV === 'production',
  tokens: {
    gap: {
      sm: '0.25rem',
      md: '0.5rem',
      lg: '1rem'
    }
  }
})

const oneStyle = styles.one(({gap}) => `
  margin: ${gap.md};
`)
```

#### Arguments

```typescript
function createStyles<
  V extends DashTokens = DashTokens,
  T extends string = DashThemeNames
>(options: CreateStylesOptions<V, T> = {}): Styles<V, T>;
```

| Argument | Type                                          | Required? | Description           |
| -------- | --------------------------------------------- | --------- | --------------------- |
| options  | [`CreateStylesOptions`](#createstylesoptions) | No        | Configuration options |

#### Returns

A new `styles` instance

```typescript
Styles<V, T>
```

### CreateStylesOptions

| Option       | Type                                  | Required? | Default         | Description                                                                                                                                                                                                                 |
| ------------ | ------------------------------------- | --------- | --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| dash         | [`Dash`](#createdash)                 | No        | `createDash()`  | An instance of Dash created by the [`createDash()`](#createdash) factory                                                                                                                                                    |
| tokens       | `DashTokens`                          | No        |                 | Inserts design tokens into the DOM and makes them available for use in style callbacks. The name of the design tokens is automatically generated based upon the depth of the mapping i.e. `foo.bar.baz` -> `--foo-bar-baz`. |
| themes       | `DashThemes`                          | No        |                 | A mapping of theme name/CSS variable pairs. This Creates a CSS variable-based theme by defining tokens within a class name selector matching the theme name. Apart from that it works the same way `tokens` does.           |
| mangleTokens | `boolean \| {[key: string]: boolean}` | No        | `false`         | When `true` this will mangle CSS variable names. You can also provide an object with `{key: boolean}` pairs of reserved keys which will not be mangled.                                                                     |
| hash         | `(string: string) => string`          | No        | [`hash`](#hash) | Use your own hash function for creating selector names. By default Dash uses an fnv1a hashing algorithm.                                                                                                                    |

---

### createDash()

Dash is a tiny, performant CSS-in-JS style rule sheet manager similar to Emotion.

#### Example

```js
import { createDash } from "@dash-ui/styles";

const dash = createDash({ key: "css", prefix: false });
// Inserts a style named 'flex' under the selector '.flex'
// into the default style sheet
dash.insert("flex", ".flex", "display: flex;");
```

#### Arguments

```typescript
function createDash(options: CreateDashOptions = {}): Dash;
```

| Argument | Type                                      | Required? | Description           |
| -------- | ----------------------------------------- | --------- | --------------------- |
| options  | [`CreateDashOptions`](#createdashoptions) | No        | Configuration options |

#### Returns

```typescript
// An instance of Dash
export type Dash = {
  /**
   * The sheet key
   */
  readonly key: string;
  /**
   * The default style sheet used by this instance of Dash
   */
  readonly sheet: DashStyleSheet;
  /**
   * Used for tracking external sheets. You can safely add/delete new
   * custom sheets using this. Those sheets can be used in the `insert()`
   * method. The primary reason you'd want to use this is so that you can
   * create independently flushable styles/sheets.
   */
  readonly sheets: DashSheets;
  /**
   * The instance of Stylis used by this Dash instance
   */
  readonly stylis: typeof Stylis;
  /**
   * A cache of Stylis rules saved by their keys. This is only used
   * on the server for generating CSS files and strings from the keys
   * used in the cache.
   */
  readonly cache: Map<string, string>;
  /**
   * A function for inserting style rules into the document and cache.
   *
   * @param key The unique key of the rule. This is used for caching.
   * @param selector The CSS selector to insert the rule under. Omit this
   *   when inserting a global style.
   * @param styles The rules string you'd like to insert into the document or cache.
   * @param styleSheet The style sheet to insert a rule into, for example `dash.sheet`.
   */
  insert(
    key: string,
    selector: string,
    styles: string,
    styleSheet?: DashStyleSheet
  ): void;
  /**
   * An insertion cache. This tracks which keys have already been inserted into
   * the DOM to prevent duplicates.
   */
  readonly inserted: Set<string>;
};
```

### CreateDashOptions

| Option        | Type                                                              | Required? | Default         | Description                                                                                                                                                            |
| ------------- | ----------------------------------------------------------------- | --------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| key           | `string`                                                          | No        | `"ui"`          | Keys in sheets used to associate `<style>` tags with this specific Dash instances via the `dash-cache` property. This is also used as a class name prefix in `styles`. |
| nonce         | `string`                                                          | No        |                 | For security policies. A nonce is an arbitrary number that can be used just once in a cryptographic communication.                                                     |
| stylisPlugins | `Plugable[]`                                                      | No        |                 | An array of Stylis plugins. See: https://www.npmjs.com/package/stylis                                                                                                  |
| prefix        | `boolean \| ((key: string, value: any, context: any) => boolean)` | No        | `true`          | Turns on/off vendor prefixing. When a boolean, all prefixes will be turned on/off. Use a function to define your own prefixes for a given key/value.                   |
| container     | `HTMLElement`                                                     | No        | `document.head` | This is the container that `<style>` tags will be injected into when style rules are inserted.                                                                         |
| speedy        | `boolean`                                                         | No        | `true` in prod  | Uses speedy mode for `<style>` tag insertion. It's the fastest way to insert new style rules, but will make styles uneditable via dev tools in some browsers.          |

---

### compileStyles()

A utility function that will compile style objects and callbacks into CSS strings.

#### Example

```js
import { compileStyles } from "@dash-ui/styles";

const css = compileStyles({
  display: "flex",
  "> * + *": {
    marginLeft: "0.5rem",
  },
});
console.log(css);
// "display:flex;> * + *{margin-left:0.5rem;}"

const red = compileStyles(({ red }) => ({ color: red }), { red: "var(--red)" });
console.log(red);
// "color:var(--red);"
```

#### Arguments

| Argument | Type                     | Required? | Description                                |
| -------- | ------------------------ | --------- | ------------------------------------------ |
| styles   | `StyleValue<V> \| Falsy` | Yes       | A style callback, object, or string        |
| tokens   | `DashTokens`             | No        | A map of design tokens for style callbacks |

#### Returns

```typescript
string; // A CSS string
```

---

### hash()

An FNV-1a hashing algorithm with a 32-bit offset basis. FNV-1a hashes are designed to be
fast while maintaining a low collision rate. The high dispersion rate makes them
well-suited for hashing nearly identical strings. This is the default hash used by
[`createStyles()`](#createstyles).

#### Example

```js
import { hash } from "@dash-ui/styles";

console.log(hash("foo: bar;"));
// 1rcc4tl
```

#### Arguments

```typescript
function hash(string: string): string;
```

| Argument | Type     | Required? | Description                   |
| -------- | -------- | --------- | ----------------------------- |
| string   | `string` | Yes       | The string you'd like to hash |

#### Returns

```typescript
string; // A hash of the input string
```

---

### createStylesFromCache()

Creates a string of CSS based on the Dash `inserted` cache. This is an extremely fast
way to generate a CSS string. It returns an object containing the hash names of
all of the styles used as well as the CSS string.

Note that this function is unsafe in asynchronous render environments because multiple
pages using the same cache will dirty the results. This means it will not work with
Gatsby, for example.

#### Example

```js
import { styles } from "@dash-ui/styles";
import { createStylesFromCache } from "@dash-ui/styles/server";

// Inserts a new class for `display: flex;`
styles.cls`display: flex;`;

// Reads from the cache
const { css, names } = createStylesFromCache(styles);

// A CSS string generated from the cache
console.log(css);
// ".ui-1ut9bc3{display:flex;}"

// A list of all of the names that were in the cache
console.log(names);
// ["1ut9bc3"]
```

#### Arguments

```typescript
export function createStylesFromCache(
  styles = require("@dash-ui/styles").styles,
  options: CreateServerStylesOptions = {}
): ServerStylesResult;
```

| Argument | Type                                                      | Required? | Default               | Description           |
| -------- | --------------------------------------------------------- | --------- | --------------------- | --------------------- |
| styles   | `styles`                                                  | No        | `styles`              | A `styles` instance   |
| options  | [`CreateServerStylesOptions`](#createserverstylesoptions) | No        | `{clearCache: false}` | Configuration options |

#### Returns

```typescript
export interface ServerStylesResult {
  /**
   * A CSS string containing all of the styles that were used
   */
  css: string;
  /**
   * Hash names of all of the styles used in the generated CSS
   */
  names: string[];
}
```

### CreateServerStylesOptions

| Option     | Type      | Required? | Default | Description                                                                                                                                                                                                             |
| ---------- | --------- | --------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| clearCache | `boolean` | No        | `false` | Clears the Dash `inserted` cache after styles have been generated. This is useful in synchronous environments when you only want to generate CSS strings for the styles that were actually used in a given page/render. |

---

### createStyleTagFromCache()

Creates a `<style>` tag w/ CSS based on the dash `inserted` cache. This is an
extremely fast way to generate a `<style>` tag.

Note that this function is unsafe
in asynchronous render environments because multiple pages using the same cache
will dirty the results. This means it will not work with Gatsby, for example.

#### Example

```js
import { styles } from "@dash-ui/styles";
import { createStyleTagFromCache } from "@dash-ui/styles/server";

// Inserts a new class for `display: flex;`
styles.cls`display: flex;`;

// Reads from the cache
const styleTag = createStyleTagFromCache(styles);

// A <style> tag generated from the cache
console.log(styleTag);
// "<style data-dash=\"1ut9bc3\" data-cache=\"ui\">.ui-1ut9bc3{display:flex;}</style>"
```

#### Arguments

```typescript
export function createStyleTagFromCache(
  styles = require("@dash-ui/styles").styles,
  options: CreateServerStylesOptions = {}
): string;
```

| Argument | Type                                                      | Required? | Default               | Description           |
| -------- | --------------------------------------------------------- | --------- | --------------------- | --------------------- |
| styles   | `styles`                                                  | No        | `styles`              | A `styles` instance   |
| options  | [`CreateServerStylesOptions`](#createserverstylesoptions) | No        | `{clearCache: false}` | Configuration options |

#### Returns

```typescript
string; // A <style> tag with css generated from the cache
```

---

### writeStylesFromCache()

Writes a CSS to a file based on the dash `inserted` cache. This is an extremely fast
way to generate a CSS file.

Note that this function is unsafe in asynchronous render
environments because multiple pages using the same cache will dirty the results. This
means it will not work with Gatsby, for example.

#### Example

```js
import { styles } from "@dash-ui/styles";
import { writeStylesFromCache } from "@dash-ui/styles/server";

// Inserts a new class for `display: flex;`
styles.cls`display: flex;`;

// Reads from the cache
writeStylesFromCache("../public/css", styles).then(
  ({ filename, css, names }) => {
    // The filename where the file was written
    console.log(filename);
    // "../public/css/ui-115aj09.css"

    // A CSS string generated from the cache
    console.log(css);
    // ".ui-1ut9bc3{display:flex;}"

    // A list of all of the names that were in the cache
    console.log(names);
    // ["1ut9bc3"]
  }
);
```

#### Arguments

```typescript
async function writeStylesFromCache(
  outputPath = "",
  styles = require("@dash-ui/styles").styles,
  options?: WriteStylesOptions & { clearCache?: boolean }
): Promise<WriteServerStylesResult>;
```

| Argument   | Type                                                                                | Required? | Default               | Description                                                                   |
| ---------- | ----------------------------------------------------------------------------------- | --------- | --------------------- | ----------------------------------------------------------------------------- |
| outputPath | `string`                                                                            | No        | `""`                  | An absolute or relative path dictating where you want to output the CSS file. |
| styles     | `styles`                                                                            | No        | `styles`              | A `styles` instance                                                           |
| options    | [`WriteServerStylesOptions & CreateServerStylesOptions`](#writeserverstylesoptions) | No        | `{clearCache: false}` | Configuration options                                                         |

#### Returns

```typescript
export interface WriteServerStylesResult {
  /**
   * The filename of the generated file. This is the `outputPath` joined
   * to the basename of the CSS file that was generated.
   */
  filename: string;
  /**
   * The basename of the CSS file that was generated.
   */
  name: string;
  /**
   * The output path of the CSS file excluding the basename.
   */
  path: string;
  /**
   * The CSS string that was generated and written to the output
   * file.
   */
  css: string;
  /**
   * The hash names of all of the styles that were inserted into
   * the generated CSS string.
   */
  names: string[];
}
```

### WriteServerStylesOptions

| Option | Type                         | Required? | Description                                                                                                                                                                        |
| ------ | ---------------------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| name   | `string`                     | No        | Use this if you want to create your own name for the CSS file. By default, this function will create a filename based on the hash of the generated CSS string and the key in Dash. |
| hash   | `(string: string) => string` | No        | Use a custom hash function for creating the name of your CSS file. By default this function will use the hash function attached to your `styles` instance.                         |

---

### createStylesFromString()

Creates a string of CSS based on an HTML string. This function will parse your HTML
output for Dash class names and pull the styles associated with them from the Dash cache.
It returns an object containing the hash names of all of the styles used as well as the
CSS string.

This is a safe way to generate style strings in an asynchronous environment.

#### Example

```js
import { styles } from "@dash-ui/styles";
import { createStylesFromString } from "@dash-ui/styles/server";

// Inserts a new class for `display: flex;`
styles.cls`display: flex;`;

// This function will match names in the style cache against
// class names found in your HTML string. It will create CSS
// from the names it finds.
const { css, names } = createStylesFromString(
  '<div class="ui-1ut9bc3"></div>',
  styles
);

// A CSS string generated from the cache
console.log(css);
// ".ui-1ut9bc3{display:flex;}"

// A list of all of the names that were in the cache
console.log(names);
// ["1ut9bc3"]
```

#### Arguments

```typescript
export function createStylesFromString(
  html: string,
  styles = require("@dash-ui/styles").styles
): ServerStylesResult;
```

| Argument | Type     | Required? | Default  | Description         |
| -------- | -------- | --------- | -------- | ------------------- |
| html     | `string` | Yes       |          | An HTML string      |
| styles   | `styles` | No        | `styles` | A `styles` instance |

#### Returns

```typescript
export interface ServerStylesResult {
  /**
   * A CSS string containing all of the styles that were used
   */
  css: string;
  /**
   * Hash names of all of the styles used in the generated CSS
   */
  names: string[];
}
```

---

### createStyleTagFromString()

Creates a `<style>` tag w/ CSS based on an HTML string. This function will parse your HTML
output for Dash class names and pull the styles associated with them from the Dash cache.

This is a safe way to generate `<style>` tags in an asynchronous environment.

#### Example

```js
import { styles } from "@dash-ui/styles";
import { createStyleTagFromString } from "@dash-ui/styles/server";

// Inserts a new class for `display: flex;`
styles.cls`display: flex;`;

// This function will match names in the style cache against
// class names found in your HTML string. It will create a <style>
// tag from the names it finds.
const styleTag = createStyleTagFromString(
  '<div class="ui-1ut9bc3"></div>',
  styles
);

console.log(styleTag);
// "<style data-dash=\"1ut9bc3\" data-cache=\"ui\">.ui-1ut9bc3{display:flex;}</style>"
```

#### Arguments

```typescript
function createStyleTagFromString(
  html: string,
  styles = require("@dash-ui/styles").styles
): string;
```

| Argument | Type     | Required? | Default  | Description         |
| -------- | -------- | --------- | -------- | ------------------- |
| html     | `string` | Yes       |          | An HTML string      |
| styles   | `styles` | No        | `styles` | A `styles` instance |

#### Returns

```typescript
string; // A <style> tag with css generated from the cache
```

---

### writeStylesFromString()

Writes a CSS to a file based on an HTML string. This function will parse your HTML
output for Dash class names and pull the styles associated with them from the Dash
cache.

This is a safe way to generate CSS files in an asynchronous environment.

#### Example

```js
import { styles } from "@dash-ui/styles";
import { writeStylesFromString } from "@dash-ui/styles/server";

// Inserts a new class for `display: flex;`
styles.cls`display: flex;`;

// This function will match names in the style cache against
// class names found in your HTML string. It will create a CSS
// file from the names it finds.
writeStylesFromString(
  '<div class="ui-1ut9bc3"></div>',
  "../public/css",
  styles
).then(({ filename, css, names }) => {
  // The filename where the file was written
  console.log(filename);
  // "../public/css/ui-115aj09.css"

  // A CSS string generated from the cache
  console.log(css);
  // ".ui-1ut9bc3{display:flex;}"

  // A list of all of the names that were in the cache
  console.log(names);
  // ["1ut9bc3"]
});
```

#### Arguments

```typescript
async function writeStylesFromString(
  html: string,
  outputPath = "",
  styles = require("@dash-ui/styles").styles,
  options?: WriteServerStylesOptions
): Promise<WriteServerStylesResult>;
```

| Argument   | Type                                                    | Required? | Default  | Description                                                                   |
| ---------- | ------------------------------------------------------- | --------- | -------- | ----------------------------------------------------------------------------- |
| html       | `string`                                                | Yes       |          | An HTML string                                                                |
| outputPath | `string`                                                | No        | `""`     | An absolute or relative path dictating where you want to output the CSS file. |
| styles     | `styles`                                                | No        | `styles` | A `styles` instance                                                           |
| options    | [`WriteServerStylesOptions`](#writeserverstylesoptions) | No        |          | Configuration options                                                         |

#### Returns

```typescript
export interface WriteServerStylesResult {
  /**
   * The filename of the generated file. This is the `outputPath` joined
   * to the basename of the CSS file that was generated.
   */
  filename: string;
  /**
   * The basename of the CSS file that was generated.
   */
  name: string;
  /**
   * The output path of the CSS file excluding the basename.
   */
  path: string;
  /**
   * The CSS string that was generated and written to the output
   * file.
   */
  css: string;
  /**
   * The hash names of all of the styles that were inserted into
   * the generated CSS string.
   */
  names: string[];
}
```

---

## Strongly typed tokens

You can strongly type your design tokens a couple of ways. The easiest way is to create your
own `styles` instance with [`createStyles()`](#createstyles):

[Play with this example on **CodeSandbox**](https://codesandbox.io/s/dash-uistyles-strongly-typed-tokens-example-1-8e62y?file=/src/App.tsx)

```typescript
import { createStyles } from "@dash-ui/styles";

export const styles = createStyles({
  // createStyles() uses these tokens to create a generic
  // for variable usage in the styles instance
  tokens: {
    color: {
      // var(--color-red)
      red: "#c17",
    },
  },
});

styles.one(({ color }) => ({
  // Will autocomplete and pass type checking
  color: color.red,
  // bgRed is not in our `tokens` and this will fail
  // type checking
  backgroundColor: color.bgRed,
}));
```

You can also strongly type your design tokens using a module declaration:

[Play with this example on **CodeSandbox**](https://codesandbox.io/s/dash-uistyles-strongly-typed-tokens-example-2-yk9bc?file=/src/App.tsx)

```typescript
const tokens = {
  color: {
    red: "#c17",
  },
};

type AppTokens = typeof tokens;

declare module "@dash-ui/styles" {
  export interface DashTokens extends AppTokens {}
}

// OR alternatively
declare module "@dash-ui/styles" {
  export interface DashTokens {
    color: {
      red: string;
    };
  }
}
```

## Strongly typed themes

You can strongly type your CSS variable themes a couple of ways. The easiest way is to create your
own `styles` instance with [`createStyles()`](#createstyles):

[Play with the example on **CodeSandbox**](https://codesandbox.io/s/dash-uistyles-strongly-typed-themes-example-1-mww3c?file=/src/App.tsx)

```typescript
import { createStyles } from "@dash-ui/styles";

export const styles = createStyles({
  // createStyles() uses these themes to create a generic
  // for variable and theme usage in the styles instance
  themes: {
    light: {
      color: {
        // var(--color-bg)
        bg: "#fafafa",
      },
    },
    dark: {
      color: {
        // var(--color-bg)
        bg: "#1a1a1a",
      },
    },
  },
});

styles.one(({ color }) => ({
  // Will autocomplete and pass type checking
  backgroundColor: color.bg,
  // "red" is not in our `themes` and this will fail
  // type checking
  color: color.red,
}));

// Likewise, this will pass typechecking
styles.theme("dark");

// This will not
styles.theme("whoami");
```

You can also strongly type your CSS variable themes using a module declaration:

[Play with the example on **CodeSandbox**](https://codesandbox.io/s/dash-uistyles-strongly-typed-themes-example-2-64me1?file=/src/App.tsx)

```typescript
const themes = {
  light: {
    color: {
      // var(--color-bg)
      bg: "#fafafa",
    },
  },
  dark: {
    color: {
      // var(--color-bg)
      bg: "#1a1a1a",
    },
  },
};

type AppThemes = typeof themes;
type AppTokens = AppThemes["dark"] & AppThemes["light"];

declare module "@dash-ui/styles" {
  export interface DashTokens extends AppTokens {}
  export interface DashThemes extends AppThemes {}
}

// OR alternatively
declare module "@dash-ui/styles" {
  export interface DashTokens {
    color: {
      bg: string;
    };
  }

  export interface DashThemes {
    light: DashTokens;
    dark: DashTokens;
  }
}
```

---

## Acknowledgements

This library was heavily inspired by the original [Emotion](https://github.com/emotion-js) and fellow
Coloradan [Kye Hohenberger](https://twitter.com/kyehohenberger).

I am grateful to have had that base, however, the implementations of the libraries have diverged
quite a bit by now.

---

![wait its all functions? always has been](https://i.imgflip.com/5mvok2.jpg)

## LICENSE

MIT
