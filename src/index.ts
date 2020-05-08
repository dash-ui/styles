// A huge amount of credit for this library goes to the emotion
// team and to Sebastian McKenzie at Facebook for inspiring the
// API design
import Stylis from '@emotion/stylis'
import unitless from '@dash-ui/unitless'
import type {Plugable, Plugin, Context} from '@emotion/stylis'
const IS_BROWSER = typeof document !== 'undefined'

//
// Where the magic happens
const createStyles = <
  V extends DashVariables = DashVariables,
  T extends string = ThemeNames
>(
  dash: Dash<V, T>
): Styles<V, T> => {
  const {
    key,
    sheet,
    insert,
    hash,
    themes,
    insertCache,
    variablesCache,
    globalCache,
  } = dash

  let addLabels: (name: string, args: any[]) => string
  // explicit here on purpose so it's not in every test
  /* istanbul ignore next */
  if (process.env.NODE_ENV === 'development') {
    addLabels = (name, args) => {
      // add helpful labels to the name in development
      return args
        .reduce((curr, arg) => {
          if (typeof arg === 'string') {
            curr += `-${arg}`
          } else if (typeof arg === 'object') {
            const keys = Object.keys(arg).filter((k) => arg[k])

            if (keys.length) {
              curr += `-${keys.join('-')}`
            }
          }

          return curr
        }, name)
        .replace(/[^\w-]/g, '-')
    }
  }

  const styles: Styles<V, T> = <N extends string>(
    styleMap: StyleMap<N, V>
  ): Style<N, V> => {
    // Compiles style objects down to strings right away since that's what
    // they'll be eventually anyway.
    const compiledStyleMap: StyleMap<N, V> = {}
    let styleName: keyof typeof styleMap
    /* istanbul ignore next */
    for (styleName in styleMap)
      compiledStyleMap[styleName] =
        typeof compiledStyleMap[styleName] !== 'function'
          ? compileStyles(styleMap[styleName], dash.variables)
          : styleMap[styleName]

    // style('text', 'space', {})
    const style: Style<N, V> = (...args) => {
      const normalizedStyles = compileArguments<N, V>(
        dash,
        compiledStyleMap,
        args
      )
      if (!normalizedStyles) return ''
      let name = hash(normalizedStyles)

      if (process.env.NODE_ENV === 'development') {
        name = addLabels(name, args)
      }

      const className = key + '-' + name
      insert('.' + className, name, normalizedStyles, sheet)
      return className
    }

    style.styles = compiledStyleMap
    style.css = (...names) =>
      compileArguments<N, V>(dash, compiledStyleMap, names)

    return style
  }

  //
  // Methods
  styles.create = (options) => createStyles(createDash(options))

  styles.one = (literals, ...placeholders) => {
    let styleValue =
      typeof literals === 'function'
        ? literals
        : compileStyles<V>(
            compileLiterals<V>(literals, placeholders),
            dash.variables
          )

    const createStyle = () =>
      (styleValue =
        typeof styleValue === 'string'
          ? styleValue
          : compileStyles<V>(styleValue, dash.variables))
    let className: string

    const callback: StylesOne = (createClassName): string => {
      const style = createStyle()
      if (!style || (!createClassName && createClassName !== void 0)) return ''
      className = className || key + '-' + hash(style)
      insert('.' + className, className, style, sheet)
      return className
    }

    ;(callback.css = createStyle).toString = callback.css
    return (callback.toString = callback)
  }

  styles.variables = (vars, selector = ':root') => {
    const {styles, variables} = serializeVariables(vars)
    if (!styles) return noop
    const name = hash(styles)
    dash.variables = mergeVariables<V>(dash.variables, variables)
    const variablesSheet = (variablesCache[name] = variablesCache[name] || {
      count: 0,
      sheet: styleSheet(sheet),
    }).sheet
    variablesCache[name].count += 1
    insert(selector, name, styles, variablesSheet)

    return () => {
      if (variablesCache[name].count === 1) {
        delete insertCache[name]
        delete variablesCache[name]
        variablesSheet.flush()
      } else {
        variablesCache[name].count -= 1
      }
    }
  }

  styles.themes = (nextThemes) => {
    const ejectors: (() => void)[] = []

    for (const name in nextThemes) {
      themes[name] =
        themes[name] === void 0
          ? nextThemes[name]
          : mergeVariables<V>(themes[name], nextThemes[name])
      ejectors.push(styles.variables(themes[name], `.${key}-${name}-theme`))
    }

    return () => ejectors.forEach((e) => e())
  }

  styles.theme = (theme) => `${key}-${theme}-theme`

  styles.global = (literals, ...placeholders) => {
    const normalizedStyles = compileStyles<V>(
      compileLiterals<V>(literals, placeholders),
      dash.variables
    )
    if (!normalizedStyles) return noop
    const name = hash(normalizedStyles)
    const globalSheet = (globalCache[name] = globalCache[name] || {
      count: 0,
      sheet: styleSheet(sheet),
    }).sheet
    globalCache[name].count += 1
    insert('', name, normalizedStyles, globalSheet)

    return () => {
      if (globalCache[name].count === 1) {
        delete insertCache[name]
        delete globalCache[name]
        globalSheet.flush()
      } else {
        globalCache[name].count -= 1
      }
    }
  }

  styles.variables(dash.variables)
  styles.themes(themes)
  styles.dash = dash
  return styles
}

export interface Styles<
  V extends DashVariables = DashVariables,
  T extends string = ThemeNames
> {
  <N extends string>(styleMap: StyleMap<N, V>): Style<N, V>
  create: <W extends DashVariables = V, U extends string = ThemeNames>(
    options?: CreateDashOptions<W, U>
  ) => Styles<W, U>
  one: (
    literals: TemplateStringsArray | string | StyleObject | StyleCallback<V>,
    ...placeholders: string[]
  ) => StylesOne
  variables: (vars: V, selector?: string) => () => void
  themes: (themes: Dash<V, T>['themes']) => () => void
  theme: (name: T) => string
  global: (
    literals: TemplateStringsArray | string | StyleCallback<V> | StyleObject,
    ...placeholders: string[]
  ) => () => void
  dash: Dash<V, T>
}

export type StyleMap<
  N extends string,
  V extends DashVariables = DashVariables
> = {
  [Name in N | 'default']?: StyleValue<V>
}

export interface Style<
  N extends string = string,
  V extends DashVariables = DashVariables
> {
  (...args: StyleArguments<N>): string
  css: {
    (...names: StyleArguments<N>): string
  }
  styles: StyleMap<N, V>
}

export type StyleArguments<N extends string = string> = (
  | N
  | {
      [Name in N]?: boolean | null | undefined | string | number
    }
  | Falsy
)[]

export type StyleValue<V extends DashVariables = DashVariables> =
  | string
  | StyleCallback<V>
  | StyleObject

export type StyleObject = {
  [property: string]: StyleObject | string | number
}

export type StyleCallback<V extends DashVariables = DashVariables> = (
  variables: V
) => StyleObject | string

export type StylesOne = {
  (createClassName?: boolean | number | string | null): string
  toString: () => string
  css: {
    (): string
    toString: () => string
  }
}

//
// Dash cache
export const createDash = <
  V extends DashVariables = DashVariables,
  T extends string = ThemeNames
>(
  options: CreateDashOptions<V, T> = {}
): Dash<V, T> => {
  // Based on
  // https://github.com/emotion-js/emotion/blob/master/packages/cache/src/index.js
  let {
    key = 'ui',
    nonce,
    speedy,
    hash: dashHash = hash,
    stylisPlugins,
    prefix = true,
    container = IS_BROWSER ? document.head : void 0,
    variables = {} as V,
    themes = {} as Dash<V, T>['themes'],
  } = options
  const stylis = new Stylis({prefix})
  speedy =
    speedy === void 0 || speedy === null
      ? !(
          typeof process !== 'undefined' &&
          process.env.NODE_ENV !== 'production'
        )
      : speedy
  let insert: Dash<V, T>['insert'],
    insertCache: Dash<V, T>['insertCache'] = {},
    stylisCache: Dash<V, T>['stylisCache'] = {}

  if (IS_BROWSER) {
    let nodes = document.querySelectorAll(`style[data-cache="${key}"]`)
    let i = 0
    let j = 0

    for (; i < nodes.length; i++) {
      const node = nodes[i]
      const attr = node.getAttribute(`data-dash`)
      if (attr === null) continue
      const ids = attr.split(' ')

      for (j = 0; j < ids.length; j++) {
        insertCache[ids[j]] = 1
      }

      if (node.parentNode !== container)
        (container as HTMLElement).appendChild(node)
    }

    stylis.use(stylisPlugins)(ruleSheet)

    insert = (selector, name, styles, sheet) => {
      if (insertCache[name] === 1) return
      insertCache[name] = 1
      Sheet.current = sheet
      stylis(selector, styles)
    }
  } else {
    // server side
    if (stylisPlugins || prefix !== void 0) stylis.use(stylisPlugins)
    stylisCache = (getServerStylisCache as any)(stylisPlugins || [])(prefix)

    insert = (selector, name, styles) => {
      if (insertCache[name]) return
      insertCache[name] = 1
      stylisCache[name] = stylis(selector, styles)
    }
  }

  if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'production') {
    const commentStart = /\/\*/g
    const commentEnd = /\*\//g

    stylis.use((context, content) => {
      if (context === -1) {
        while (commentStart.test(content)) {
          commentEnd.lastIndex = commentStart.lastIndex

          /* istanbul ignore next */
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

  return {
    key,
    sheet: styleSheet({
      key,
      container,
      nonce,
      speedy,
    }),
    stylis,
    hash: safeHash(key, dashHash),
    insert,
    variables,
    themes,
    stylisCache,
    insertCache,
    variablesCache: {},
    globalCache: {},
    clear() {
      this.insertCache = insertCache = {}
    },
  }
}

export interface CreateDashOptions<
  V extends DashVariables = DashVariables,
  T extends string = ThemeNames
> {
  readonly key?: string
  readonly nonce?: string
  readonly hash?: typeof hash
  readonly stylisPlugins?: Plugable[]
  readonly prefix?:
    | boolean
    | ((key: string, value: any, context: any) => boolean)
  readonly container?: HTMLElement
  readonly speedy?: boolean
  readonly variables?: V
  readonly themes?: Dash<V, T>['themes']
}

export type Dash<
  V extends DashVariables = DashVariables,
  T extends string = ThemeNames
> = {
  readonly key: string
  readonly sheet: DashStyleSheet
  readonly hash: (string: string) => string
  readonly stylis: typeof Stylis
  readonly stylisCache: {
    [name: string]: string
  }
  readonly insert: (
    selector: string,
    name: string,
    styles: string,
    sheet: DashStyleSheet
  ) => void
  insertCache: {
    [name: string]: number
  }
  variables: V
  themes: {
    [Name in T]: V
  }
  readonly variablesCache: {
    [name: string]: {
      count: number
      sheet: DashStyleSheet
    }
  }
  readonly globalCache: {
    [name: string]: {
      count: number
      sheet: DashStyleSheet
    }
  }
  readonly clear: () => void
}

//
// Stylesheet
const styleSheet = (options: DashStyleSheetOptions): DashStyleSheet => {
  // Based off emotion and glamor's StyleSheet
  const {key, container, nonce, speedy} = options
  const tags: HTMLStyleElement[] = []
  let size = 0

  return {
    // include all keys so it the object can be cloned via styleSheet(sheet)
    key,
    nonce,
    container,
    speedy,
    insert(rule) {
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
            tags.length === 0 ? null : tags[tags.length - 1].nextSibling
          )
        tags.push(tag)
      }

      const tag = tags[tags.length - 1]

      if (!speedy) {
        tag.appendChild(document.createTextNode(rule))
      } else {
        let sheet: StyleSheet | CSSStyleSheet | null = tag.sheet
        let i = 0
        /* istanbul ignore next */
        if (!sheet) {
          // this weirdness brought to you by firefox
          const {styleSheets} = document
          for (; i < styleSheets.length; i++)
            if (styleSheets[i].ownerNode === tag) {
              sheet = styleSheets[i]
              break
            }
        }

        /* istanbul ignore next */
        try {
          // this is a really hot path
          // we check the second character first because having "i"
          // as the second character will happen less often than
          // having "@" as the first character
          const isImportRule =
            rule.charCodeAt(1) === 105 && rule.charCodeAt(0) === 64
          // this is the ultrafast version, works across browsers
          // the big drawback is that the css won't be editable in devtools
          ;(sheet as CSSStyleSheet).insertRule(
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
            isImportRule ? 0 : (sheet as CSSStyleSheet).cssRules.length
          )
        } catch (e) {
          if (
            typeof process !== 'undefined' &&
            process.env.NODE_ENV !== 'production'
          ) {
            console.warn(
              `There was a problem inserting the following rule: "${rule}"`,
              e
            )
          }
        }
      }

      size++
    },
    flush() {
      tags.forEach((tag) => (tag.parentNode as HTMLElement).removeChild(tag))
      tags.length = 0
      size = 0
    },
  }
}

export interface DashStyleSheetOptions {
  readonly key: string
  readonly container?: HTMLElement
  readonly nonce?: string
  readonly speedy: boolean
}

export interface DashStyleSheet {
  // include all keys so it the object can be cloned via styleSheet(sheet)
  readonly key: string
  readonly nonce?: string
  readonly container?: HTMLElement
  readonly speedy: boolean
  readonly insert: (rule: string) => void
  readonly flush: () => void
}

//
// Utils
function noop() {}
export type Falsy = false | 0 | null | undefined

const weakMemo = <A extends object, T = any>(fn: (arg: A) => T) => {
  const cache = new WeakMap()
  return (arg: A) => {
    let cached = cache.get(arg)
    if (cached) return cached
    cached = fn(arg)
    cache.set(arg, cached)
    return cached
  }
}

export const hash = (string: string): string => {
  // fnv1a hash
  let out = 2166136261 // 32-bit offset basis
  let i = 0
  let len = string.length

  for (; i < len; ++i) {
    out ^= string.charCodeAt(i)
    out += (out << 1) + (out << 4) + (out << 7) + (out << 8) + (out << 24)
  }

  return (out >>> 0).toString(36)
}

const defaultHashCache: Record<string, string> = {}
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const fnCache = weakMemo((fn: typeof hash): Record<string, string> => ({}))
const safeHash = (key: string, hashFn: typeof hash) => (string: string) => {
  const hashCache = hashFn === hash ? defaultHashCache : fnCache(hashFn)
  let value: string | undefined = hashCache[string]
  if (value) return value
  value = hashFn(string)
  // allows class names to start with numbers
  return (hashCache[string] =
    !key && !isNaN(value[0] as any) ? '_' + value : value)
}

//
// Stylis plugins
const getServerStylisCache = IS_BROWSER
  ? null
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
    weakMemo((plugins: Plugable[]) => {
      const getCache = weakMemo((
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        prefix: (key: string, value: any, context: any) => boolean
      ) => ({}))
      const prefixTrueCache = {}
      const prefixFalseCache = {}

      return (
        prefix: boolean | ((key: string, value: any, context: any) => boolean)
      ): {} => {
        if (prefix === void 0 || prefix === true) return prefixTrueCache
        if (prefix === false) return prefixFalseCache
        return getCache(prefix)
      }
    })

const RULE_DELIMITER = '/*|*/'
const RULE_NEEDLE = RULE_DELIMITER + '}'

// @ts-ignore
const ruleSheet: Plugin = (
  // https://github.com/thysultan/stylis.js/tree/master/plugins/rule-sheet
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
): string | undefined => {
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
    } else {
      /* istanbul ignore next */
      return content + (at === 0 ? RULE_DELIMITER : '')
    }
  } else if (context === -2) {
    content.split(RULE_NEEDLE).forEach((c: string) => toSheet(c))
  }

  return
}

const Sheet: {
  current: {
    readonly insert: (rule: string) => void
  }
} = {
  current: {
    insert: noop,
  },
}

const toSheet = (block: string) => {
  block && Sheet.current && Sheet.current.insert(block + '}')
}

//
// Style serialization
const compileArguments = <
  N extends string,
  V extends DashVariables = DashVariables
>(
  dash: Dash<V>,
  styleMap: StyleMap<N, V>,
  args: StyleArguments<N>
): string => {
  let styles = args[0]

  if (args.length > 1) {
    let i = 0
    styles = {}

    for (; i < args.length; i++) {
      const arg = args[i],
        toArg = typeof arg

      if (toArg === 'string') {
        styles[arg as N] = true
      } else if (toArg === 'object') {
        Object.assign(styles, arg)
      }
    }
  }

  let nextStyles = styleMap.default
    ? compileStylesMemo<N, V>(styleMap, 'default', dash.variables)
    : ''

  if (typeof styles === 'string' && styles !== 'default') {
    nextStyles += compileStylesMemo<N, V>(styleMap, styles, dash.variables)
  } else if (typeof styles === 'object' && styles !== null) {
    for (const key in styles)
      if (styles[key] && key !== 'default')
        nextStyles += compileStylesMemo<N, V>(styleMap, key, dash.variables)
  }

  return nextStyles
}

const minifyRe = [
  /[\s\n\t]{2,}/g,
  /([:;,([{}>~/]|\/\*)\s+/g,
  /\s+([;,)\]{}>~/!]|\*\/)/g,
]

export const compileStyles = <V extends DashVariables = DashVariables>(
  styles: StyleValue<V> | Falsy,
  variables: V
): string => {
  const value = typeof styles === 'function' ? styles(variables) : styles
  return (typeof value === 'object' && value !== null
    ? stringifyStyleObject(value)
    : // Fucking TypeScript w/o "strict": true throws here
      ((value || '') as string)
  )
    .trim()
    .replace(minifyRe[0], ' ')
    .replace(minifyRe[1], '$1')
    .replace(minifyRe[2], '$1')
}

const compileStylesMemo = <
  N extends string,
  V extends DashVariables = DashVariables
>(
  styleMap: StyleMap<N, V>,
  key: N | 'default',
  variables: V
): string => {
  const styles = styleMap[key]
  return typeof styles === 'function'
    ? (styleMap[key] = compileStyles<V>(styles, variables))
    : (styles as string | Falsy) || ''
}

const stringifyStyleObject = (object: StyleObject) => {
  let string = ''

  for (const key in object) {
    const value = object[key]
    const toV = typeof value
    if (value === null || toV === 'boolean') continue
    if (toV === 'object')
      string += `${key}{${stringifyStyleObject(value as StyleObject)}}`
    else {
      const isCustom = key.charCodeAt(1) === 45
      string += `${isCustom ? key : cssCase(key)}:${
        toV !== 'number' || unitless[key] === 1 || value === 0 || isCustom
          ? value
          : value + 'px'
      };`
    }
  }

  return string
}

const compileLiterals = <V extends DashVariables = DashVariables>(
  literals: TemplateStringsArray | string | StyleObject | StyleCallback<V>,
  placeholders: string[]
) =>
  Array.isArray(literals)
    ? literals.reduce(
        (curr, next, i) => curr + next + (placeholders[i] || ''),
        ''
      )
    : literals

//
// Variable and theme serialization
const cssCaseRe = /[A-Z]|^ms/g
const cssDisallowedRe = /[^\w-]/g
const cssCase = (string: string) =>
  string.replace(cssCaseRe, '-$&').toLowerCase()

const serializeVariables = (
  vars: Record<string, any>,
  names?: string[]
): SerializedVariables => {
  const keys = Object.keys(vars)
  const variables: Record<string, any> = {}
  let styles = ''
  let i = 0

  for (; i < keys.length; i++) {
    const key = keys[i]
    const cssKey = cssCase(key).replace(cssDisallowedRe, '-')
    const value = vars[key]

    if (typeof value === 'object') {
      const result = serializeVariables(
        value,
        (names = names || []).concat(cssKey)
      )
      variables[key] = result.variables
      styles += result.styles
    } else {
      let name =
        names !== void 0 && names.length > 0 ? '--' + names.join('-') : '-'
      variables[key] = `var(${(name += '-' + cssKey)})`
      styles += `${name}:${value};`
    }
  }

  return {variables, styles}
}

type SerializedVariables = {
  readonly variables: Record<string, Record<string, any> | string | number>
  readonly styles: string
}

const mergeVariables = <V extends DashVariables = DashVariables>(
  target: V,
  source: {[name: string]: any}
): V => {
  const next: any = Object.assign({}, target)

  for (const key in source) {
    const value = source[key]
    next[key] =
      typeof value === 'object' ? mergeVariables(next[key] || {}, value) : value
  }

  return next
}

//
// Variables and themes defined in user space
export interface DashVariables {}
export interface DashThemes {}
export type ThemeNames = Extract<keyof DashThemes, string>

//
// Creates and exports default dash styles function
const styles: Styles<DashVariables, ThemeNames> = createStyles(createDash())

export default styles
