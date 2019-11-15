import defaultStyles from '../'

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
    seen = new Set(),
    names = unique(
      dash.variablesCache
        .concat(dash.globalCache)
        .concat(Object.keys(dash.insertCache))
    )

  for (let i = 0; i < names.length; i++) {
    const name = names[i]
    if (!seen.has(name)) {
      css += styleCache[name]
      seen.add(name)
    }
  }

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
    `<style data-${styles.dash.key}="${names.join(' ')}"${nonceString}>` +
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
  const styleIds = Object.keys(styleCache)

  let css = '',
    names = styles.dash.variablesCache.concat(styles.dash.globalCache)

  for (let i = 0; i < names.length; i++) css += styleCache[names[i]]

  for (let i = 0; i < styleIds.length; i++) {
    const styleId = styleIds[i]
    if (string.indexOf(`${styles.dash.key}-${styleId}`) > -1) {
      css += styleCache[styleId]
      names.push(styleId)
    }
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
    `<style data-${styles.dash.key}="${names.join(' ')}"${nonceString}>` +
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
