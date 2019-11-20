import bench from '@essentials/benchmark'
import styles from '../src'
import {
  writeStylesFromString,
  writeStylesFromCache,
  createStyleTagFromString,
  createStyleTagFromCache,
} from '../server-src'
import doc from './doc'

bench('create styles [object]', () => styles({foo: {display: 'flex'}}))
const style = styles({foo: {display: 'flex'}})
bench('style', () => style('foo'))
bench('multi-style', () => style('foo', 'bar'))
bench('object-style', () => style({foo: true, bar: false}, 'bar'))

for (let i = 0; i < 100000; i++) styles.dash.stylisCache[`${i}-foo`] = 1
console.log(createStyleTagFromString(doc, styles, {clearCache: false}))
bench('create styles from string', () => {
  createStyleTagFromString(doc, styles, {clearCache: false})
})

console.log(createStyleTagFromCache(styles, {clearCache: false}))
bench('create styles from cache', () => {
  createStyleTagFromCache(styles, {clearCache: false})
})

writeStylesFromString('<div className="-ui-1ut9bc3">', __dirname, styles, {
  clearCache: false,
}).then(console.log)

writeStylesFromCache(__dirname, styles).then(console.log)
