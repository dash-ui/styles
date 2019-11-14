import fs from 'fs'
import path from 'path'
import defaultStyles from '../'

export const writeStyles = async (
  outputPath,
  styles = defaultStyles,
  options = {}
) => {
  styles = styles || defaultStyles
  let {name, hash = styles.dash.hash, clearCache = true} = options
  const stylesString = styles.extract(clearCache)
  name = `${name || hash(stylesString)}.css`
  const filename = path.join(outputPath, name)
  await fs.promises.writeFile(filename, stylesString)
  return {filename, name, path: outputPath, styles: stylesString}
}

export const writeStylesFromString = async (
  string,
  outputPath = '',
  styles = defaultStyles,
  options = {}
) => {
  styles = styles || defaultStyles
  let {name, hash = styles.dash.hash, clearCache = true} = options
  const stylesString = extractStylesFromString(string, styles, {clearCache})
  name = `${name || hash(stylesString)}.css`
  const filename = path.join(outputPath, name)
  await fs.promises.writeFile(filename, stylesString)
  return {filename, name, path: outputPath, styles: stylesString}
}

const extractStylesFromString_ = (
  string,
  styles = defaultStyles,
  options = {}
) => {
  const {clearCache = true} = options
  const styleCache = styles.dash.stylisCache
  const styleIds = Object.keys(styleCache)
  let css = styles.extract(clearCache),
    names = styles.dash.variablesCache.concat(styles.dash.globalCache)

  // if (new RegExp(`${styles.dash.key}-${styleId}`).test(string)) {
  for (let styleId of styleIds)
    if (string.indexOf(`${styles.dash.key}-${styleId}`) > -1) {
      css += styleCache[styleId]
      names.push(styleId)
    }

  return {names, css}
}

export const extractStylesFromString = (string, styles, options) =>
  extractStylesFromString_(string, styles, options).css

export const extractStyleTagsFromString = (string, styles, options) => {
  const {css, names} = extractStylesFromString_(string, styles, options)
  const nonceString = styles.dash.sheet.nonce
    ? ` nonce="${styles.dash.sheet.nonce}"`
    : ''

  return (
    `<style data-${styles.dash.key}="${names.join(' ')}"${nonceString}>` +
    css +
    `</style>`
  )
}
