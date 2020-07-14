import bench from '@essentials/benchmark'
import {styles} from '../dist/module'

bench('create styles [object]', ({duration}) => {
  duration(3000)
  return () => styles({foo: {display: 'flex'}})
})
bench('create styles [string]', ({duration}) => {
  duration(3000)
  return () => styles({foo: `display: flex;`})
})

bench('create one [object]', ({duration}) => {
  duration(3000)
  return () => styles.one({display: 'flex'})()
})

bench('create one [string]', ({duration}) => {
  duration(3000)
  return () => styles.one(`display: flex;`)()
})

const uno = styles.one(`display: flex;`)
bench('use one [object]', ({duration}) => {
  duration(3000)
  return () => uno()
})

bench('use one [string]', ({duration}) => {
  duration(3000)
  return () => uno()
})

bench('use one [string]', ({duration}) => {
  duration(3000)
  return () => uno()
})

bench('use cls [string]', ({duration}) => {
  duration(3000)
  return () => styles.cls(`display: flex;`)
})

bench('use cls [object]', ({duration}) => {
  duration(3000)
  return () => styles.cls({display: 'flex'})
})

bench('use cls [callback]', ({duration}) => {
  duration(3000)
  return () => styles.cls(() => ({display: 'flex'}))
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
    style = styles({[key]: {display: 'flex'}})
  })
  return () => style(key)
})
bench('[cold] multi-style', ({before}) => {
  let style
  let key
  before(() => {
    key = String(Math.random())
    style = styles({[key]: {display: 'flex'}})
  })
  return () => style(key, 'bar')
})
bench('[cold] object style', ({before}) => {
  let style
  let key
  before(() => {
    key = String(Math.random())
    style = styles({[String(key)]: {display: 'flex'}})
  })
  return () => style({bar: true, [key]: false}, 'bar')
})

bench('[cold] style callback', ({before}) => {
  let style
  let key
  before(() => {
    key = String(Math.random())
    style = styles({[String(key)]: () => ({display: 'flex'})})
  })
  return () => style(key, 'bar')
})
