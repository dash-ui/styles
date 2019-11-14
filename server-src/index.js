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
  const stylesString = extractStyleTagsFromString(string, styles, {clearCache})
  name = `${name || hash(stylesString)}.css`
  const filename = path.join(outputPath, name)
  await fs.promises.writeFile(filename, stylesString)
  return {filename, name, path: outputPath, styles: stylesString}
}

export const extractStyleTagsFromString = (
  string,
  styles = defaultStyles,
  options = {}
) => {
  const {clearCache = true} = options
  const styleCache = styles.dash.stylisCache
  const styleIds = Object.keys(styleCache)
  let css = styles.extract(clearCache),
    names = styles.dash.variablesCache.concat(styles.dash.globalCache)

  for (let styleId of styleIds)
    if (new RegExp(`${styles.dash.key}-${styleId}`).test(string)) {
      // if (string.indexOf(`${styles.dash.key}-${styleId}`) > -1) {
      css += styleCache[styleId]
      names.push(styleId)
    }

  const nonceString = styles.dash.sheet.nonce
    ? ` nonce="${styles.dash.sheet.nonce}"`
    : ''
  return (
    `<style data-${styles.dash.key}="${names.join(' ')}"${nonceString}>` +
    css +
    `</style>`
  )
}
