const {main} = require('../package.json')
const defaultStyles = require(`../${main}`).default

function unique() {
  const set = {},
    out = []

  for (let i = 0; i < arguments.length; i++) {
    for (let j = 0; j < arguments[i].length; j++) {
      const value = arguments[i][j]
      if (set[value] === 1) continue
      set[value] = 1
      out.push(value)
    }
  }

  return out
}

export const createStylesFromCache = (styles = defaultStyles, options = {}) => {
  // createStylesFromCache() is unsafe in asynchronous render environments
  const {clearCache = true} = options,
    {dash} = styles,
    styleCache = dash.stylisCache

  let css = '',
    names = unique(
      Object.keys(styles.dash.variablesCache),
      Object.keys(dash.globalCache),
      Object.keys(dash.insertCache)
    )

  for (let i = 0; i < names.length; i++) css += styleCache[names[i]]
  if (clearCache) dash.clear()
  return {names, css}
}

export const createStyleTagFromCache = (
  styles = defaultStyles,
  options = {}
) => {
  // createStyleTagFromCache() is unsafe in asynchronous render environments
  const {css, names} = createStylesFromCache(styles, options)
  const nonceString = styles.dash.sheet.nonce
    ? ` nonce="${styles.dash.sheet.nonce}"`
    : ''

  return (
    `<style data-dash="${names.join(' ')}" data-cache="${
      styles.dash.key
    }"${nonceString}>` +
    css +
    `</style>`
  )
}

export const writeStylesFromCache = async (
  outputPath = '',
  styles = defaultStyles,
  options = {}
) => {
  // requiring in here prevents webpack errors in stuff like Next.js apps
  const fs = require('fs')
  const path = require('path')
  styles = styles || defaultStyles
  let {name, hash = styles.dash.hash, clearCache = true} = options
  const stylesString = createStylesFromCache(styles, {clearCache}).css
  name = `${name || styles.dash.key + '-' + hash(stylesString) + '.css'}`
  const filename = path.join(outputPath, name)
  await fs.promises.writeFile(filename, stylesString)
  return {filename, name, path: outputPath, styles: stylesString}
}

export const createStylesFromString = (
  string,
  styles = defaultStyles,
  options = {}
) => {
  const {clearCache = true} = options
  const {dash} = styles
  const styleCache = dash.stylisCache

  let css = '',
    names = unique(
      Object.keys(styles.dash.variablesCache),
      Object.keys(styles.dash.globalCache)
    )
  for (let name of names) css += styleCache[name]

  let cache = ''
  let value = ''
  const maxCacheLen = styles.dash.key.length + 1
  const seen = {}

  for (let i = 0; i < string.length; i++) {
    const char = string.charAt(i)
    if (char === ' ') continue
    cache += char

    if (value.length > 0) {
      value += char
      const name = value.substring(maxCacheLen)
      const style = styleCache[name]

      if (style !== void 0) {
        if (seen[name] === void 0) {
          names.push(name)
          seen[name] = 1
          css += style
        }

        value = ''
        cache = ''
      }
    }

    if (cache.length > maxCacheLen) cache = cache.substring(1)
    if (cache === styles.dash.key + '-') value = cache
  }

  if (clearCache) dash.clear()
  return {names, css}
}

export const createStyleTagFromString = (
  string,
  styles = defaultStyles,
  options
) => {
  const {css, names} = createStylesFromString(string, styles, options)
  const nonceString = styles.dash.sheet.nonce
    ? ` nonce="${styles.dash.sheet.nonce}"`
    : ''

  return (
    `<style data-dash="${names.join(' ')}" data-cache="${
      styles.dash.key
    }"${nonceString}>` +
    css +
    `</style>`
  )
}

export const writeStylesFromString = async (
  string,
  outputPath = '',
  styles = defaultStyles,
  options = {}
) => {
  // requiring in here prevents webpack errors in stuff like Next.js apps
  const fs = require('fs')
  const path = require('path')
  styles = styles || defaultStyles
  let {name, hash = styles.dash.hash, clearCache = true} = options
  const stylesString = createStylesFromString(string, styles, {clearCache}).css
  name = `${name || styles.dash.key + '-' + hash(stylesString) + '.css'}`
  const filename = path.join(outputPath, name)
  await fs.promises.writeFile(filename, stylesString)
  return {filename, name, path: outputPath, styles: stylesString}
}
