import bench from '@essentials/benchmark'
import styles from '../src'
import {writeStyles} from '../server-src'

bench('create styles [object]', () => styles({foo: {display: 'flex'}}))
const style = styles({foo: {display: 'flex'}})
bench('style', () => style('foo'))
bench('multi-style', () => style('foo', 'bar'))
bench('object-style', () => style({foo: true, bar: false}, 'bar'))

writeStyles(styles, __dirname).then(console.log)
