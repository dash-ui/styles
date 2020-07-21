import bench from '@essentials/benchmark'
import {css} from 'emotion'
import {styles} from '../dist/module'

bench('emotion css [object]', ({duration}) => {
  duration(1000)
  return () => css({display: 'flex'})
})

bench('use cls [object]', ({duration}) => {
  duration(1000)
  return () => styles.cls({display: 'flex'})
})

bench('emotion css [string]', ({duration}) => {
  duration(1000)
  return () =>
    css`
      display: flex;
    `
})

bench('use cls [string]', ({duration}) => {
  duration(1000)
  return () => styles.cls`
    display: flex;
  `
})

bench('[cold] emotion css [object]', ({duration, before}) => {
  duration(1000)
  let key
  before(() => {
    key = String(Math.random())
  })
  return () => css({width: key})
})

bench('[cold] use cls [object]', ({duration, before}) => {
  duration(1000)
  let key
  before(() => {
    key = String(Math.random())
  })
  return () => styles.cls({width: key})
})

bench('[cold] emotion css [string]', ({duration, before}) => {
  duration(1000)
  let key
  before(() => {
    key = String(Math.random())
  })
  return () =>
    css`
      width: ${key};
    `
})

bench('[cold] use cls [string]', ({duration, before}) => {
  duration(1000)
  let key
  before(() => {
    key = String(Math.random())
  })
  return () => styles.cls`
    width: ${key};
  `
})

bench('create styles [object]', ({duration}) => {
  duration(1000)
  return () => styles({foo: {display: 'flex'}})
})

bench('create styles [string]', ({duration}) => {
  duration(1000)
  return () => styles({foo: `display: flex;`})
})

bench('create one [object]', ({duration}) => {
  duration(1000)
  return () => styles.one({display: 'flex'})()
})

bench('create one [string]', ({duration}) => {
  duration(1000)
  return () => styles.one(`display: flex;`)()
})

const uno = styles.one(`display: flex;`)

bench('use one', ({duration}) => {
  duration(1000)
  return () => uno()
})

const style = styles({foo: {display: 'flex'}})
bench('style', () => style('foo'))
bench('multi-style', () => style('foo', 'bar'))
bench('object-style', () => style({foo: true, bar: false}, 'bar'))

const styleCallback = styles({foo: () => ({display: 'flex'})})
bench('style [callback]', () => styleCallback('foo'))
bench('multi-style [callback]', () => styleCallback('foo', 'bar'))
bench('object-style [callback]', () =>
  styleCallback({foo: true, bar: false}, 'bar')
)

bench('[cold] style', ({before}) => {
  let style
  let key
  before(() => {
    key = String(Math.random())
    style = styles({[key]: {width: key}})
  })
  return () => style(key)
})
bench('[cold] multi-style', ({before}) => {
  let style
  let key
  before(() => {
    key = String(Math.random())
    style = styles({[key]: {width: key}})
  })
  return () => style(key, 'bar')
})
bench('[cold] object style', ({before}) => {
  let style
  let key
  before(() => {
    key = String(Math.random())
    style = styles({[key]: {width: key}})
  })
  return () => style({bar: true, [key]: true}, 'bar')
})

bench('[cold] style callback', ({before}) => {
  let style
  let key
  before(() => {
    key = String(Math.random())
    style = styles({[key]: () => ({width: key})})
  })
  return () => style(key, 'bar')
})
