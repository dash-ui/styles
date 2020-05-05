import bench from '@essentials/benchmark'
import styles from '../dist/module'

bench('create styles [object]', ({duration}) => {
  duration(5000)
  return () => styles({foo: {display: 'flex'}})
})
bench('create styles [string]', ({duration}) => {
  duration(5000)
  return () => styles({foo: `display: flex;`})
})
const style = styles({foo: {display: 'flex'}})
bench('style', () => style('foo'))
bench('multi-style', () => style('foo', 'bar'))
bench('object-style', () => style({foo: true, bar: false}, 'bar'))
