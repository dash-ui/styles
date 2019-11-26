// A huge amount of credit for this library goes to the emotion
// team and to Sebastian McKenzie at Facebook for inspiring the
// API design
import Stylis, {Plugable, Plugin, Context} from '@emotion/stylis'
import unitless from '@emotion/unitless'
import memoize from 'trie-memoize'

//
// Constants
const __DEV__ =
  typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'
const IS_BROWSER = typeof document !== 'undefined'

//
// Hashing (fnv1a)
const OFFSET_BASIS_32 = 2166136261
export const fnvHash = (string: string): string => {
  let out = OFFSET_BASIS_32,
    i = 0
  const len = string.length
  for (; i < len; ++i) {
    out ^= string.charCodeAt(i)
    out += (out << 1) + (out << 4) + (out << 7) + (out << 8) + (out << 24)
  }
  return (out >>> 0).toString(36)
}
const unsafeClassName = /^[0-9]/
const safeHash = (
  key: string,
  hash: typeof fnvHash
): ((string: string) => string) =>
  memoize([{}], (string: string) => {
    const out = hash(string)
    // allows class names to start with numbers
    return !key && unsafeClassName.test(out) ? `_${out}` : out
  })

//
// Stylis plugins
// https://github.com/thysultan/stylis.js/tree/master/plugins/rule-sheet
const RULE_DELIMITER = '/*|*/'
const RULE_NEEDLE = RULE_DELIMITER + '}'

interface CurrentSheet {
  insert: (rule: string) => void
}

interface Sheet {
  current: CurrentSheet
}

const Sheet: Sheet = {
  current: {
    insert: (): void => {},
  },
}

const toSheet = (block: string): void => {
  block && Sheet.current && Sheet.current.insert(block + '}')
}

// @ts-ignore
const ruleSheet: Plugin = (
  context: Context,
  content: any,
  selectors: string[],
  parents: string[],
  line: number,
  column: number,
  length: number,
  ns: number,
  depth: number,
  at: number
): any => {
  // property
  if (context === 1) {
    if (content.charCodeAt(0) === 64) {
      // @import
      Sheet.current.insert(content + ';')
      return ''
    }
  }
  // selector
  else if (context === 2) {
    if (ns === 0) return content + RULE_DELIMITER
  }
  // at-rule
  else if (context === 3) {
    // @font-face, @page
    if (ns === 102 || ns === 112) {
      Sheet.current.insert(selectors[0] + content)
      return ''
    } else return content + (at === 0 ? RULE_DELIMITER : '')
  } else if (context === -2) {
    const contents = content.split(RULE_NEEDLE)
    for (let i = 0; i < contents.length; i++) toSheet(contents[i])
  }
}

//
// Configuration
const getServerStylisCache:
  | null
  | ((
      string: string,
      plugins: Plugable[]
    ) => (
      prefix: boolean | ((key: string, value: any, context: any) => boolean)
    ) => void) = IS_BROWSER
  ? null
  : memoize([{}, WeakMap], () => {
      const getCache = memoize([WeakMap], () => ({}))
      const prefixTrueCache = {}
      const prefixFalseCache = {}

      return (prefix: string | void | boolean): {} => {
        if (prefix === void 0 || prefix === true) return prefixTrueCache
        if (prefix === false) return prefixFalseCache
        return getCache(prefix)
      }
    })

const emptyArr = []

export interface DashOptions {
  key?: string
  nonce?: string
  hash?: typeof fnvHash
  stylisPlugins?: Plugable[]
  prefix?: boolean | ((key: string, value: any, context: any) => boolean)
  container?: HTMLElement
  speedy?: boolean
}

export interface InsertCache {
  [name: string]: number
}

export interface Variables {
  [name: string]: any
}

export interface StoredVariables {
  [name: string]: any
}

export interface GlobalCache {
  [name: string]: {
    count: number
    sheet: DashStyleSheet
  }
}

export interface StylisCache {
  [name: string]: string
}

export interface Themes {
  [name: string]: Variables
}

export interface DashCache {
  key: string
  sheet: DashStyleSheet
  hash: (string: string) => string
  stylis: typeof Stylis
  stylisCache: StylisCache
  insert: (
    selector: string,
    name: string,
    styles: string,
    sheet: DashStyleSheet
  ) => void
  insertCache: InsertCache
  variables: StoredVariables
  variablesCache: GlobalCache
  themes: Themes
  globalCache: GlobalCache
  clear: () => void
}

export const createDash = (options: DashOptions = {}): DashCache => {
  // Based on
  // https://github.com/emotion-js/emotion/blob/master/packages/cache/src/index.js
  let {
    // eslint-disable-next-line prefer-const
    key = '-ui',
    // eslint-disable-next-line prefer-const
    nonce,
    // eslint-disable-next-line prefer-const
    hash = fnvHash,
    // eslint-disable-next-line prefer-const
    stylisPlugins,
    // eslint-disable-next-line prefer-const
    prefix = true,
    // eslint-disable-next-line prefer-const
    container = IS_BROWSER ? document.head : void 0,
    speedy,
  } = options
  const stylis = new Stylis({prefix})
  speedy = speedy === void 0 || speedy === null ? !__DEV__ : speedy
  let insert,
    insertCache = {},
    stylisCache

  if (IS_BROWSER) {
    const nodes = document.querySelectorAll(`style[data-cache="${key}"]`)

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      const attr = node.getAttribute(`data-dash`)
      if (attr === null) continue
      const ids = attr.split(' ')
      for (let i = 0; i < ids.length; i++) insertCache[ids[i]] = 1
      // @ts-ignore
      if (node.parentNode !== container) container.appendChild(node)
    }

    stylis.use(stylisPlugins)(ruleSheet)

    insert = (
      selector: string,
      name: string,
      styles: string,
      sheet: DashStyleSheet
    ): void => {
      if (dash.insertCache[name] === 1) return
      Sheet.current = sheet
      dash.insertCache[name] = 1
      stylis(selector, styles)
    }
  } else {
    // server side
    if (stylisPlugins || prefix !== void 0) stylis.use(stylisPlugins)
    stylisCache =
      getServerStylisCache &&
      getServerStylisCache(key, stylisPlugins || emptyArr)(prefix)

    insert = (selector: string, name: string, styles: string): void => {
      if (dash.insertCache[name]) return
      if (dash.stylisCache[name] === void 0) {
        dash.stylisCache[name] = stylis(selector, styles)
      }
      dash.insertCache[name] = 1
    }
  }

  if (__DEV__) {
    const commentStart = /\/\*/g
    const commentEnd = /\*\//g

    stylis.use((context, content) => {
      if (context === -1) {
        while (commentStart.test(content)) {
          commentEnd.lastIndex = commentStart.lastIndex

          if (commentEnd.test(content)) {
            commentStart.lastIndex = commentEnd.lastIndex
            continue
          }

          throw new Error(
            'Your styles have an unterminated comment ("/*" without ' +
              'corresponding "*/").'
          )
        }

        commentStart.lastIndex = 0
      }
    })
  }

  const dash: DashCache = {
    key,
    sheet: styleSheet({
      key,
      container,
      nonce,
      speedy,
    }),
    hash: safeHash(key, hash),
    stylis,
    stylisCache,
    insert,
    insertCache,
    variables: {},
    variablesCache: {},
    themes: {},
    globalCache: {},
    clear() {
      this.insertCache = insertCache = {}
    },
  }

  return dash
}

//
// Style sheets
export interface DashStyleSheet {
  // include all keys so it the object can be cloned via styleSheet(sheet)
  key: string
  nonce?: string
  container?: HTMLElement
  speedy: boolean
  insert: (rule: string) => void
  flush: () => void
}

export interface DashStyleSheetOptions {
  key: string
  container?: HTMLElement
  nonce?: string
  speedy: boolean
}

export const styleSheet = (options: DashStyleSheetOptions): DashStyleSheet => {
  // Based off emotion and glamor's StyleSheet
  const {key, container, nonce, speedy} = options
  let size = 0,
    before
  const tags: HTMLStyleElement[] = []

  return {
    // include all keys so it the object can be cloned via styleSheet(sheet)
    key,
    nonce,
    container,
    speedy,
    insert(rule): void {
      // the max length is how many rules we have per style tag, it's 65000 in
      // speedy mode it's 1 in dev because we insert source maps that map a
      // single rule to a location and you can only have one source map per
      // style tag
      if (size % (speedy ? 65000 : 1) === 0) {
        const tag = document.createElement('style')
        tag.setAttribute(`data-dash`, key)
        if (nonce !== void 0) tag.setAttribute('nonce', nonce)
        tag.appendChild(document.createTextNode(''))
        container &&
          container.insertBefore(
            tag,
            tags.length === 0 ? before : tags[tags.length - 1].nextSibling
          )
        tags.push(tag)
      }

      const tag = tags[tags.length - 1]
      if (!speedy) tag.appendChild(document.createTextNode(rule))
      else {
        let sheet: StyleSheet | CSSStyleSheet | null = tag.sheet

        if (!sheet) {
          // this weirdness brought to you by firefox
          /* istanbul ignore next */
          for (let i = 0; i < document.styleSheets.length; i++) {
            if (document.styleSheets[i].ownerNode === tag) {
              sheet = document.styleSheets[i]
              break
            }
          }
        }

        try {
          // this is a really hot path
          // we check the second character first because having "i"
          // as the second character will happen less often than
          // having "@" as the first character
          const isImportRule =
            rule.charCodeAt(1) === 105 && rule.charCodeAt(0) === 64
          // this is the ultrafast version, works across browsers
          // the big drawback is that the css won't be editable in devtools
          // @ts-ignore
          sheet.insertRule(
            rule,
            // we need to insert @import rules before anything else
            // otherwise there will be an error
            // technically this means that the @import rules will
            // _usually_(not always since there could be multiple style tags)
            // be the first ones in prod and generally later in dev
            // this shouldn't really matter in the real world though
            // @import is generally only used for font faces from google fonts
            // and etc. so while this could be technically correct then it
            // would be slower and larger for a tiny bit of correctness that
            // won't matter in the real world
            // @ts-ignore
            isImportRule ? 0 : sheet.cssRules.length
          )
        } catch (e) {
          /* istanbul ignore next */
          if (__DEV__) {
            console.warn(
              `There was a problem inserting the following rule: "${rule}"`,
              e
            )
          }
        }
      }

      size++
    },
    flush(): void {
      for (let i = 0; i < tags.length; i++) {
        // @ts-ignore
        tags[i].parentNode.removeChild(tags[i])
      }

      tags.length = 0
      size = 0
    },
  }
}

//
// Style serialization
const isProcessableValue = (value?: any): boolean =>
  value !== null && typeof value !== 'boolean'
const cssCaseRe = /[A-Z]|^ms/g
const cssCase = (string: string): string =>
  string.replace(cssCaseRe, '-$&').toLowerCase()
const interpolate = (
  literals?: TemplateStringsArray | string[] | string | null,
  placeholders?: string[]
): string => {
  if (typeof literals === 'string') return literals
  if (!literals) return ''
  let str = ''
  placeholders = placeholders || []
  for (let i = 0; i < literals.length; i++)
    str += literals[i] + (placeholders[i] || '')
  return str
}

const isCustomProperty = (property: string): boolean =>
  property.charCodeAt(1) === 45
const styleName = (styleName: string): string =>
  isCustomProperty(styleName) ? styleName : cssCase(styleName)
const styleValue = (key: string, value: any): string =>
  unitless[key] !== 1 &&
  !isCustomProperty(key) &&
  typeof value === 'number' &&
  value !== 0
    ? `${value}px`
    : value

export interface StyleObject {
  [property: string]: any
}

const styleObjectToString = (object: StyleObject): string => {
  const keys = Object.keys(object)
  let string = '',
    i = 0

  for (; i < keys.length; i++) {
    const key = keys[i]
    const value = object[key]
    if (typeof value === 'object')
      string += `${key}{${styleObjectToString(value)}}`
    else if (isProcessableValue(value))
      string += `${styleName(key)}:${styleValue(key, value)};`
  }

  return string
}

export interface SerializedVariables {
  variables: StoredVariables
  styles: string
}

const serializeVariables_ = (
  vars: string | string[] | number | number[] | Variables,
  names: string[]
): SerializedVariables => {
  const keys = Object.keys(vars)
  const variables = {}
  let styles = ''

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const cssKey = cssCase(key)
    const value = vars[key]

    if (typeof value === 'object') {
      names = names || []
      const result = serializeVariables_(value, names.concat(cssKey))
      variables[key] = result.variables
      styles += result.styles
    } else {
      let name = '--'
      if (names !== void 0 && names.length > 0) name += names.join('-')
      name += name === '--' ? cssKey : `-${cssKey}`
      variables[key] = `var(${name})`
      styles += `${name}:${value};`
    }
  }

  return {variables, styles}
}

const serializeVariables = memoize([WeakMap], serializeVariables_)

const mergeVariables_ = (
  target: StoredVariables | {},
  source: string | string[] | number | number[] | Variables
): StoredVariables => {
  target = Object.assign({}, target)
  const keys = Object.keys(source)

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i],
      value = source[key]
    if (typeof value === 'object')
      target[key] = mergeVariables_(target[key] || {}, value)
    else target[key] = value
  }

  return target
}

const mergeVariables = memoize([WeakMap, WeakMap], mergeVariables_)

const minifyRe = [
  /\s{2,}|\n|\t/g,
  /([:;,([{}>~/])\s+/g,
  /\s+([;,)\]{}>~/!])/g,
  /(\/\*)\s+/,
  /\s+(\*\/)/,
]

export type StyleGetter = (variables: StoredVariables) => StyleObject | string

const normalizeStyles_ = (
  styles: string | StyleObject | StyleGetter,
  variables: StoredVariables
): string => {
  styles =
    typeof styles === 'function'
      ? normalizeStyles_(styles(variables), variables)
      : typeof styles === 'object'
      ? styleObjectToString(styles)
      : styles

  return !styles
    ? ''
    : styles
        .replace(minifyRe[0], ' ')
        .replace(minifyRe[1], '$1')
        .replace(minifyRe[2], '$1')
        .replace(minifyRe[3], '$1')
        .replace(minifyRe[4], '$1')
        .trim()
}

export const normalizeStyles = memoize([Map, WeakMap], normalizeStyles_)

export interface StyleDefs {
  [name: string]: string | StyleGetter | Styles | StyleObject
}

const normalizeStyleObject = (
  dash: DashCache,
  styleDefs: StyleDefs,
  styleName?: string | StyleObjectArgument
): string => {
  let nextStyles = styleDefs.default
    ? normalizeStyles(styleDefs.default, dash.variables)
    : ''

  if (typeof styleName === 'string' && styleName !== 'default') {
    nextStyles += normalizeStyles(styleDefs[styleName], dash.variables)
  } else if (typeof styleName === 'object') {
    const keys = Object.keys(styleName)

    for (let i = 0; i < keys.length; i++)
      if (styleName[keys[i]] && keys[i] !== 'default')
        nextStyles += normalizeStyles(styleDefs[keys[i]], dash.variables)

    nextStyles = normalizeStyles(nextStyles, dash.variables)
  }

  return nextStyles
}

const normalizeArgs = (
  dash: DashCache,
  styleDefs: StyleDefs,
  args: (string | StyleObjectArgument)[]
): string => {
  if (args.length > 1) {
    const argDefs = {}

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (typeof arg === 'string') argDefs[arg] = true
      else if (typeof arg === 'object') Object.assign(argDefs, arg)
    }

    return normalizeStyleObject(dash, styleDefs, argDefs)
  } else return normalizeStyleObject(dash, styleDefs, args[0])
}

const disallowedClassChars = /[^a-z0-9_-]/gi

export interface CSSFunction {
  (...names: (string | StyleObjectArgument)[]): string
}

export interface EjectGlobal {
  (): void
}

export interface Styles extends Function {
  create: (options?: DashOptions) => Styles
  one: (
    literals: TemplateStringsArray | string | StyleObject | StyleGetter,
    ...placeholders: string[]
  ) => OneCallback
  variables: (vars: Variables, selector?: string) => EjectGlobal
  themes: (vars: Variables) => EjectGlobal
  global: (
    literals: TemplateStringsArray | string | StyleGetter | StyleObject,
    ...placeholders: string[]
  ) => EjectGlobal
  theme: (name: string) => string
  dash: DashCache
}

export interface StyleObjectArgument {
  [name: string]: boolean | string | number | null | void
}

export interface Style extends Function {
  css: CSSFunction
  dash: DashCache
  styles: StyleDefs
}

export interface OneCallbackCss extends Function {
  (): string
  toString: () => string
}

export interface OneCallback extends Function {
  (createClassName?: boolean | number | string | null): string
  toString: () => string
  css: OneCallbackCss
}

//
// Where the magic happens
const createStyles = (dash: DashCache): Styles => {
  let addLabels: (
    name: string,
    args: (string | StyleObjectArgument)[]
  ) => string
  // explicit here on purpose so it's not in every test
  if (process.env.NODE_ENV === 'development') {
    addLabels = (
      name: string,
      args: (string | StyleObjectArgument)[]
    ): string => {
      // add helpful labels to the name in development
      for (let i = 0; i < args.length; i++) {
        const arg = args[i]

        if (typeof arg === 'string') name += `-${arg}`
        else if (typeof arg === 'object') {
          const keys = Object.keys(arg).filter(k => arg[k])
          if (keys.length) name += `-${keys.join('-')}`
        }
      }

      return name.replace(disallowedClassChars, '-')
    }
  }

  const styles: Styles = (...args: StyleDefs[]): Style => {
    let defs = args[0]
    if (args.length > 1) {
      defs = Object.assign(
        {},
        // @ts-ignore
        ...args.map(arg => (typeof arg === 'function' ? arg.styles : arg))
      )
    }

    //
    // style(text, space, {})
    const style: Style = (
      ...args: (string | StyleObjectArgument)[]
    ): string => {
      const normalizedStyles = normalizeArgs(dash, defs, args)
      if (!normalizedStyles) return ''
      let name = dash.hash(normalizedStyles)
      // explicit here on purpose so it's not in every test
      if (process.env.NODE_ENV === 'development') name = addLabels(name, args)
      const className = `${dash.key}-${name}`
      dash.insert(`.${className}`, name, normalizedStyles, dash.sheet)
      return className
    }

    style.css = function(...names: (string | StyleObjectArgument)[]): string {
      return normalizeArgs(dash, defs, names)
    }
    style.dash = dash
    style.styles = defs
    return style
  }

  //
  // Methods
  styles.create = (options?: DashOptions): Styles =>
    createStyles(createDash(options))

  styles.one = (
    literals: TemplateStringsArray | string | StyleObject | StyleGetter,
    ...placeholders: string[]
  ): OneCallback => {
    const css = Array.isArray(literals)
      ? interpolate(literals, placeholders)
      : literals

    const style = styles({default: css})
    const callback = (
      createClassName?: boolean | number | string | null
    ): string => (createClassName || createClassName === void 0 ? style() : '')
    callback.toString = (): string => callback()
    callback.css = (): string => style.css('default')
    callback.css.toString = callback.css
    return callback
  }

  styles.variables = (vars: Variables, selector = ':root'): EjectGlobal => {
    const serialized = serializeVariables(vars)
    dash.variables = mergeVariables(dash.variables, serialized.variables)
    const name = dash.hash(serialized.styles)
    dash.variablesCache[name] = dash.variablesCache[name] || {
      count: 0,
      sheet: styleSheet(dash.sheet),
    }
    dash.variablesCache[name].count += 1
    const sheet = dash.variablesCache[name].sheet
    dash.insert(selector, name, serialized.styles, sheet)

    return (): void => {
      if (dash.variablesCache[name].count === 1) {
        delete dash.insertCache[name]
        delete dash.variablesCache[name]
        sheet.flush()
      } else dash.variablesCache[name].count -= 1
    }
  }

  styles.themes = (vars: Themes): EjectGlobal => {
    Object.assign(dash.themes, vars)
    const themes = Object.keys(vars)
    const ejectors: (() => void)[] = []

    for (let i = 0; i < themes.length; i++) {
      const theme = themes[i]
      ejectors.push(
        styles.variables(dash.themes[theme], `.${dash.key}-${theme}-theme`)
      )
    }

    return (): void => {
      for (let i = 0; i < ejectors.length; i++) ejectors[i]()
    }
  }

  styles.theme = (theme: string): string => `${dash.key}-${theme}-theme`

  styles.global = (
    literals: TemplateStringsArray | string | StyleObject | StyleGetter,
    ...placeholders: string[]
  ): EjectGlobal => {
    const styles = Array.isArray(literals)
      ? interpolate(literals, placeholders)
      : literals

    const normalizedStyles = normalizeStyles(styles, dash.variables)
    if (!normalizedStyles) return (): void => {}
    const name = dash.hash(normalizedStyles)
    dash.globalCache[name] = dash.globalCache[name] || {
      count: 0,
      sheet: styleSheet(dash.sheet),
    }
    const sheet = dash.globalCache[name].sheet
    dash.globalCache[name].count += 1
    dash.insert('', name, normalizedStyles, sheet)

    return (): void => {
      if (dash.globalCache[name].count === 1) {
        delete dash.insertCache[name]
        delete dash.globalCache[name]
        sheet.flush()
      } else dash.globalCache[name].count -= 1
    }
  }

  styles.dash = dash
  return styles
}

//
// Creates default dash styles function
export const styles = createStyles(createDash())
export default styles
