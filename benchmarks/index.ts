import bench from '@essentials/benchmark'
import styles from '../dist/module'

bench('create styles [object]', ({duration}) => {
  duration(3000)
  return () => styles({foo: {display: 'flex'}})
})
bench('create styles [string]', ({duration}) => {
  duration(3000)
  return () => styles({foo: `display: flex;`})
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
