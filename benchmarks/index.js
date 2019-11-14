import bench from '@essentials/benchmark'
import styles from '../src'
import {writeStyles, writeStylesFromString} from '../server'

bench('create styles [object]', () => styles({foo: {display: 'flex'}}))
const style = styles({foo: {display: 'flex'}})
bench('style', () => style('foo'))
bench('multi-style', () => style('foo', 'bar'))
bench('object-style', () => style({foo: true, bar: false}, 'bar'))

writeStyles(__dirname, styles).then(console.log)
writeStylesFromString(
  '<div className="dash-dash-1ut9bc3">',
  __dirname,
  styles
).then(console.log)
