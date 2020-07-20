<hr>
<div align="center">
  <br/>
  <br/>
  <img src='https://github.com/dash-ui/styles/raw/master/assets/logo.png'/>
  <br/>
  <br/>
</div>

<p align="center">
  <a href="https://bundlephobia.com/result?p=@dash-ui/styles">
    <img alt="Bundlephobia" src="https://img.shields.io/bundlephobia/minzip/@dash-ui/styles?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Types" href="https://www.npmjs.com/package/@dash-ui/styles">
    <img alt="Types" src="https://img.shields.io/npm/types/@dash-ui/styles?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Code coverage report" href="https://codecov.io/gh/dash-ui/styles">
    <img alt="Code coverage" src="https://img.shields.io/codecov/c/gh/dash-ui/styles?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Build status" href="https://travis-ci.com/dash-ui/styles">
    <img alt="Build status" src="https://img.shields.io/travis/com/dash-ui/styles?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="NPM version" href="https://www.npmjs.com/package/@dash-ui/styles">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/@dash-ui/styles?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="License" href="https://jaredlunde.mit-license.org/">
    <img alt="MIT License" src="https://img.shields.io/npm/l/@dash-ui/styles?style=for-the-badge&labelColor=24292e">
  </a>
</p>

<pre align="center">npm i @dash-ui/styles</pre>
<hr>

## Quick Start

[Check out an example on **CodeSandbox**](https://codesandbox.io/s/dash-ui-react-example-029p5)

```jsx harmony
// React example
import * as React from 'react'
import {styles} from '@dash-ui/styles'

// Any global styles or variables that are inserted into the DOM
// can be easily ejected by calling the function they return.
const ejectVariables = styles.insertVariables({
  color: {
    // var(--color-brand)
    brand: '#ee5b5f',
    // var(--color-white)
    white: '#fafafa',
  },
  elevation: {
    // var(--elevation-resting)
    resting:
      '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  },
  radius: {
    // var(--radius-primary)
    primary: '4px',
  },
})

const ejectGlobal = styles.insertGlobal`
  body {
    min-height: 100vh;
  }
`

// `styles` is a function for composing style definitions in a
// deterministic way. In the example below, you'll see an example
// of a button with default styles and two variants: one for a
// 'brand' background color and one for a 'black' background color.
const button = styles({
  // The object in this callback is a mapping to the CSS
  // variables above. `default` here is a special style name
  // that will be applied to each invocation of `button()`
  default: ({radius}) => `
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
  brand: ({color}) => ({
    backgroundColor: color.brand,
  }),
  // Lastly, styles need not use callbacks if they don't need
  // access to CSS variables
  black: {
    backgroundColor: '#000',
  },
})

const Component = (props) => (
  <div>
    {/**
     * Styles are composed in the order they're defined in arguments,
     * so they are completely deterministic.
     */}
    <button className={button('solid', 'brand')}>Solid brand</button>
    {/**
     * That is, in the button below `black`'s background color will
     * take precendence over the `brand` background color.
     */}
    <button className={button({outline: true, brand: true, black: true})}>
      Solid black
    </button>
  </div>
)
```

## API

## LICENSE

MIT
