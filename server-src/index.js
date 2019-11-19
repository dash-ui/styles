const {main} = require('../package.json')
const defaultStyles = require(`../${main}`).default

function unique() {
  const seen = {},
    out = []

  for (let i = 0; i < arguments.length; i++) {
    for (let j = 0; j < arguments[i].length; j++) {
      const value = arguments[i][j]
      if (seen[value] === true) continue
      seen[value] = true
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
    ),
    i = 0,
    result

  for (; i < names.length; i++) css += styleCache[names[i]]

  const replacer = `${styles.dash.key}-`
  const classRe = new RegExp(`[='"\\s](${styles.dash.key}-[A-Za-z0-9_-]+)[\\s'">]`, 'g')
  const seen = {}

  while ((result = classRe.exec(string)) !== null) {
    const name = result[1].slice(replacer.length)
    const style = styleCache[name]
    if (style && seen[name] === void 0) {
      css += style
      names.push(name)
      seen[name] = true
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
