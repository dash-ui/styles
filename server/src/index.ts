/* eslint-disable @typescript-eslint/no-var-requires */
type ElementType<T extends ReadonlyArray<unknown>> = T extends ReadonlyArray<
  infer ElementType
>
  ? ElementType
  : never

export interface StylesResult {
  css: string
  names: string[]
}

export interface CreateStylesOptions {
  clearCache?: boolean
}

export const createStylesFromCache = (
  styles = require('@dash-ui/styles').styles,
  options: CreateStylesOptions = {}
): StylesResult => {
  // createStylesFromCache() is unsafe in asynchronous render environments
  const {clearCache = false} = options
  const {dash} = styles
  const styleCache = dash.cache
  const names = new Set([...dash.sheets.keys(), ...dash.inserted.values()])
  let css = ''

  for (const name of names) css += styleCache.get(name)

  if (clearCache) dash.clear()
  return {names: [...names], css}
}

export const createStyleTagFromCache = (
  styles = require('@dash-ui/styles').styles,
  options: CreateStylesOptions = {}
): string => {
  // createStyleTagFromCache() is unsafe in asynchronous render environments
  const {css, names} = createStylesFromCache(styles, options)
  const nonceString = styles.dash.sheet.nonce
    ? ` nonce="${styles.dash.sheet.nonce}"`
    : ''

  return `<style data-dash="${names.join(' ')}" data-cache="${
    styles.dash.key
  }"${nonceString}>${css}</style>`
}

export interface WriteStylesOptions {
  name?: string
  hash?: (string: string) => string
}

export interface WriteStylesResult {
  filename: string
  name: string
  path: string
  styles: string
}

export const writeStylesFromCache = async (
  outputPath = '',
  styles = require('@dash-ui/styles').styles,
  options?: WriteStylesOptions & {clearCache?: boolean}
): Promise<WriteStylesResult> => {
  // requiring in here prevents webpack errors in stuff like Next.js apps
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path')
  // eslint-disable-next-line
  let {name, hash = styles.dash.hash, clearCache = false} = options || {}
  const stylesString = createStylesFromCache(styles, {clearCache}).css
  name = `${name || styles.dash.key + '-' + hash(stylesString) + '.css'}`
  const filename = path.join(outputPath, name)
  await fs.promises.writeFile(filename, stylesString)
  return {filename, name, path: outputPath, styles: stylesString}
}

export const createStylesFromString = (
  string: string,
  styles = require('@dash-ui/styles').styles
): StylesResult => {
  const {dash} = styles
  const styleCache = dash.cache
  const names = new Set<string>(dash.sheets.keys())
  let css = ''

  for (let name of names) css += styleCache.get(name)

  for (const [, name] of string.matchAll(
    new RegExp(`["\\s'=]${dash.key}-([A-Za-z0-9]+)`, 'g')
  )) {
    if (!names.has(name)) {
      css += styleCache.get(name) || ''
      names.add(name)
    }
  }

  return {names: [...names], css}
}

export const createStyleTagFromString = (
  string: string,
  styles = require('@dash-ui/styles').styles
): string => {
  const {css, names} = createStylesFromString(string, styles)
  const nonceString = styles.dash.sheet.nonce
    ? ` nonce="${styles.dash.sheet.nonce}"`
    : ''

  return `<style data-dash="${names.join(' ')}" data-cache="${
    styles.dash.key
  }"${nonceString}>${css}</style>`
}

export const writeStylesFromString = async (
  string: string,
  outputPath = '',
  styles = require('@dash-ui/styles').styles,
  options?: WriteStylesOptions
): Promise<WriteStylesResult> => {
  // requiring in here prevents webpack errors in stuff like Next.js apps
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path')
  let {name, hash = styles.dash.hash} = options || {}
  const stylesString = createStylesFromString(string, styles).css
  name = `${name || styles.dash.key + '-' + hash(stylesString) + '.css'}`
  const filename = path.join(outputPath, name)
  await fs.promises.writeFile(filename, stylesString)
  return {filename, name, path: outputPath, styles: stylesString}
}
