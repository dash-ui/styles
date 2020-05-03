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

```jsx harmony
// React example
import React from 'react'
import styles from '@dash-ui/styles'

styles.variables({
  colors: {
    red: '#c12',
    blue: '#09a',
    purple: '#800080',
  },
})

const style = styles({
  red: `
    color: var(--colors-red);
  `,
  blue: ({colors}) => `
    color: ${colors.blue};

    .${style('red')} {
      color: ${colors.purple};
    }
  `,
})

const Component = (props) => (
  <div className={style({blue: props.blue, red: props.red})}>
    Hello world
    <span className={style(props.blue && 'blue', props.red && 'red')}>
      Hello world
    </span>
    <span className={style('blue')}>I'm always blue</span>
    <span className={style('red')}>I'm purple when my parent is blue</span>
  </div>
)
```

## API

Coming soon. Until then [play with this React example on CodeSandbox](https://codesandbox.io/s/dash-ui-react-example-029p5)

## LICENSE

MIT
