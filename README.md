<hr>
<div align="center">
  <h1 align="center">
    @-ui/styles
  </h1>
</div>

<p align="center">
  <a href="https://bundlephobia.com/result?p=@-ui/styles">
    <img alt="Bundlephobia" src="https://img.shields.io/bundlephobia/minzip/@-ui/styles?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Code coverage report" href="https://codecov.io/gh/dash-ui/styles">
    <img alt="Code coverage" src="https://img.shields.io/codecov/c/gh/dash-ui/styles?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="Build status" href="https://travis-ci.org/dash-ui/styles">
    <img alt="Build status" src="https://img.shields.io/travis/dash-ui/styles?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="NPM version" href="https://www.npmjs.com/package/@-ui/styles">
    <img alt="NPM Version" src="https://img.shields.io/npm/v/@-ui/styles?style=for-the-badge&labelColor=24292e">
  </a>
  <a aria-label="License" href="https://jaredlunde.mit-license.org/">
    <img alt="MIT License" src="https://img.shields.io/npm/l/@-ui/styles?style=for-the-badge&labelColor=24292e">
  </a>
</p>

<pre align="center">npm i @-ui/styles</pre>
<hr>

## Quick Start

```jsx harmony
// React example
import React from 'react'
import styles from '@-ui/styles'

const style = styles({
  blue: styles => `
    color: var(--blue);

    ${styles('red')} {
      color: var(--purple);
    }
  `,
  red: `
    color: var(--red);
  `,
})

const Component = props => (
  <div className={style({blue: props.blue, red: props.red})}>
    Hello world
    <span className={style(props.blue && 'blue', props.red && 'red')}>
      Hello world
    </span>
    <span className={style('blue')}>I'm always blue</span>
    <span className={style('blue')}>I'm purple when my parent is red</span>
  </div>
)
```

## API

## LICENSE

MIT
