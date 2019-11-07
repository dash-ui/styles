import bench from '@essentials/benchmark'
import styles from '../src'

bench('create styles [object]', () => styles({foo: {display: 'block'}}))
const style = styles({foo: {display: 'block'}})
bench('style', () => style('foo'))
bench('multi-style', () => style('foo', 'bar'))
bench('object-style', () => style({foo: true, bar: false}, 'bar'))
