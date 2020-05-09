import defaultStyles from '@dash-ui/styles'

function unique(...args: any[]): any[] {
  const seen: Record<string, any> = {}
  const out: any[] = []

  for (let i = 0; i < args.length; i++) {
    for (let j = 0; j < args[i].length; j++) {
      const value = args[i][j]
      if (seen[value] === true) continue
      seen[value] = true
      out.push(value)
    }
  }

  return out
}

export interface StylesResult {
  css: string
  names: string[]
}

export interface CreateStylesOptions {
  clearCache?: boolean
}

export const createStylesFromCache = (
  styles = defaultStyles,
  options: CreateStylesOptions = {}
): StylesResult => {
  // createStylesFromCache() is unsafe in asynchronous render environments
  const {clearCache = true} = options
  const {dash} = styles
  const styleCache = dash.stylisCache
  let css = ''
  const names = unique(
    Object.keys(styles.dash.variablesCache),
    Object.keys(dash.globalCache),
    Object.keys(dash.insertCache)
  )
  let i = 0
  let len = names.length
  for (; i < len; i++) css += styleCache[names[i]]
  if (clearCache) dash.clear()
  return {names, css}
}

export const createStyleTagFromCache = (
  styles = defaultStyles,
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
  clearCache?: boolean
}

export interface WriteStylesResult {
  filename: string
  name: string
  path: string
  styles: string
}

export const writeStylesFromCache = async (
  outputPath = '',
  styles = defaultStyles,
  options?: WriteStylesOptions
): Promise<WriteStylesResult> => {
  // requiring in here prevents webpack errors in stuff like Next.js apps
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path')
  styles = styles || defaultStyles
  // eslint-disable-next-line
  let {name, hash = styles.dash.hash, clearCache = true} = options || {}
  const stylesString = createStylesFromCache(styles, {clearCache}).css
  name = `${name || styles.dash.key + '-' + hash(stylesString) + '.css'}`
  const filename = path.join(outputPath, name)
  await fs.promises.writeFile(filename, stylesString)
  return {filename, name, path: outputPath, styles: stylesString}
}

export const createStylesFromString = (
  string: string,
  styles = defaultStyles,
  options: CreateStylesOptions = {}
): StylesResult => {
  const {clearCache = true} = options
  const {dash} = styles
  const styleCache = dash.stylisCache
  let css = ''
  const names = unique(
    Object.keys(styles.dash.variablesCache),
    Object.keys(styles.dash.globalCache)
  )
  let i = 0
  let len = names.length
  for (; i < len; i++) css += styleCache[names[i]]
  const classRe = new RegExp(`${styles.dash.key}-([A-Za-z0-9_-]+)`, 'g')
  const seen: Record<string, any> = {}
  let result: RegExpMatchArray | null

  while ((result = classRe.exec(string)) !== null) {
    const name = result[1]
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
  string: string,
  styles = defaultStyles,
  options: CreateStylesOptions = {}
): string => {
  const {css, names} = createStylesFromString(string, styles, options)
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
  styles = defaultStyles,
  options?: WriteStylesOptions
): Promise<WriteStylesResult> => {
  // requiring in here prevents webpack errors in stuff like Next.js apps
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const fs = require('fs')
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path')
  styles = styles || defaultStyles
  // eslint-disable-next-line
  let {name, hash = styles.dash.hash, clearCache = true} = options || {}
  const stylesString = createStylesFromString(string, styles, {clearCache}).css
  name = `${name || styles.dash.key + '-' + hash(stylesString) + '.css'}`
  const filename = path.join(outputPath, name)
  await fs.promises.writeFile(filename, stylesString)
  return {filename, name, path: outputPath, styles: stylesString}
}
