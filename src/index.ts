// A huge amount of credit for this library goes to the emotion
// team
import Stylis from '@dash-ui/stylis'
import unitless from '@dash-ui/unitless'
import type {Plugable, Plugin, Context} from '@dash-ui/stylis'
const IS_BROWSER = typeof document !== 'undefined'

//
// Where the magic happens
export const createStyles = <
  V extends DashVariables = DashVariables,
  T extends string = ThemeNames
>(
  options: CreateStylesOptions<V, T> = {}
): Styles<V, T> => {
  const dash = createDash(options)
  const {key, sheet, insert, hash, inserted, sheets} = dash
  const themes = Object.assign({}, options.themes)
  let label: (args: any[]) => string
  // explicit here on purpose so it's not in every test
  /* istanbul ignore next */
  if (
    typeof process !== 'undefined' &&
    process.env.NODE_ENV === 'development'
  ) {
    label = (args) => {
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
        }, '')
        .replace(/[^\w-]/g, '-')
    }
  }

  const insertCssClass = (css: string | Falsy, devName = '') => {
    if (!css) return ''
    let name = hash(css)

    /* istanbul ignore next */
    if (
      typeof process !== 'undefined' &&
      process.env.NODE_ENV === 'development'
    ) {
      if (devName) name += devName
    }

    const className = key + '-' + name
    insert('.' + className, name, css, sheet)
    return className
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
    const style: Style<N, V> = (...args) =>
      insertCssClass(
        compileArguments<N, V>(dash, compiledStyleMap, args),
        typeof process !== 'undefined' && process.env.NODE_ENV === 'development'
          ? label(args)
          : ''
      )

    style.styles = compiledStyleMap
    style.css = (...names) =>
      compileArguments<N, V>(dash, compiledStyleMap, names)

    return style
  }

  styles.one = (literals, ...placeholders) => {
    let one =
      typeof literals === 'function'
        ? literals
        : compileStyles<V>(
            compileLiterals<V>(literals, placeholders),
            dash.variables
          )

    const css = () =>
      typeof one === 'string'
        ? one
        : (one = compileStyles<V>(one, dash.variables))
    let name: string
    let className: string

    const callback: StylesOne = (createClassName): string => {
      if (!createClassName && createClassName !== void 0) return ''
      const one = css()
      className = className || key + '-' + (name = name || hash(one))
      insert('.' + className, name, one, sheet)
      return className
    }

    ;(callback.css = css).toString = callback.css
    return (callback.toString = callback)
  }

  styles.join = (...style) => insertCssClass(style.join(''))

  styles.keyframes = (literals, ...placeholders) => {
    let css = compileStyles<V>(
      compileLiterals<V>(literals, placeholders),
      dash.variables
    )
    const name = hash(css)
    const safeName = 'k-' + name
    insert('', name, `@keyframes ${safeName}{${css}}`, sheet)
    return safeName
  }

  styles.variables = (vars, selector = ':root') => {
    const {css, variables} = serializeVariables(vars, options.mangleVariables)
    if (!css) return noop
    dash.variables = mergeVariables<V>(dash.variables, variables)
    return styles.global(`${selector}{${css}}`)
  }

  styles.themes = (nextThemes) => {
    const ejectors: (() => void)[] = []

    for (const name in nextThemes) {
      ejectors.push(
        styles.variables(
          // God the types here are f'ing stupid. Someone should feel free to fix this.
          (themes[name as Extract<T, string>] =
            themes[name as Extract<T, string>] === void 0
              ? (nextThemes[name] as V)
              : mergeVariables<V>(
                  themes[name as Extract<T, string>],
                  nextThemes[name] as V
                )) as any,
          '.' + styles.theme(name as any)
        )
      )
    }

    return () => ejectors.forEach((e) => e())
  }

  styles.theme = (theme) => `${key}-${theme}-theme`

  styles.global = (literals, ...placeholders) => {
    const css = compileStyles<V>(
      compileLiterals<V>(literals, placeholders),
      dash.variables
    )
    if (!css) return noop
    const name = hash(css)
    const cache = (sheets[name] = sheets[name] || {
      n: 0,
      sheet: styleSheet(sheet),
    })
    cache.n += 1
    insert('', name, css, cache.sheet)

    return () => {
      if (cache.n === 1) {
        delete inserted[name]
        delete sheets[name]
        cache.sheet.flush()
      } else {
        cache.n -= 1
      }
    }
  }

  styles.variables(dash.variables as any)
  styles.themes(themes as any)
  styles.dash = dash
  return styles
}

export interface CreateStylesOptions<
  V extends DashVariables = DashVariables,
  T extends string = ThemeNames
> extends CreateDashOptions<V> {
  themes?: {
    [Name in T]: V
  }
  mangleVariables?: boolean | Record<string, boolean>
}

export interface Styles<
  V extends DashVariables = DashVariables,
  T extends string = ThemeNames
> {
  <N extends string>(styleMap: StyleMap<N, V>): Style<N, V>
  one: (
    literals: TemplateStringsArray | string | StyleObject | StyleCallback<V>,
    ...placeholders: string[]
  ) => StylesOne
  join: (...styleCss: string[]) => string
  keyframes: (
    literals: TemplateStringsArray | string | StyleCallback<V> | StyleObject,
    ...placeholders: string[]
  ) => string
  variables: (vars: DeepPartial<V>, selector?: string) => () => void
  themes: (
    themes: DeepPartial<
      {
        [Name in T]: V
      }
    >
  ) => () => void
  theme: (name: T) => string
  global: (
    literals: TemplateStringsArray | string | StyleCallback<V> | StyleObject,
    ...placeholders: string[]
  ) => () => void
  dash: Dash<V>
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

type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? {[P in keyof T]?: DeepPartial<T[P]>}
  : T

//
// Dash cache
export const createDash = <V extends DashVariables = DashVariables>(
  options: CreateDashOptions<V> = {}
): Dash<V> => {
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
  } = options
  const stylis = new Stylis({prefix})
  speedy =
    speedy === void 0 || speedy === null
      ? !(
          typeof process !== 'undefined' &&
          process.env.NODE_ENV !== 'production'
        )
      : speedy
  let insert: Dash<V>['insert'],
    inserted: Dash<V>['inserted'] = {},
    cache: Dash<V>['cache'] = {}

  if (IS_BROWSER) {
    let nodes = document.querySelectorAll(`style[data-cache="${key}"]`)
    let i = 0
    let attr
    let node

    for (; i < nodes.length; i++) {
      /* istanbul ignore next */
      if ((attr = (node = nodes[i]).getAttribute(`data-dash`)) === null)
        continue
      attr.split(' ').map((id) => (inserted[id] = 1))

      if (node.parentNode !== container)
        (container as HTMLElement).appendChild(node)
    }

    stylis.use(stylisPlugins)(ruleSheet)

    insert = (selector, name, styles, sheet) => {
      if (inserted[name] === 1) return
      inserted[name] = 1
      Sheet.current = sheet
      stylis(selector, styles)
    }
  } else {
    // server side
    if (stylisPlugins || prefix !== void 0) stylis.use(stylisPlugins)
    cache = (getServerCache as any)(stylisPlugins || [])(prefix)

    insert = (selector, name, styles) => {
      if (inserted[name]) return
      inserted[name] = 1
      cache[name] = stylis(selector, styles)
    }
  }

  /* istanbul ignore next */
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
    cache,
    inserted,
    sheets: {},
    clear() {
      this.inserted = inserted = {}
    },
  }
}

export interface CreateDashOptions<V extends DashVariables = DashVariables> {
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
}

export type Dash<V extends DashVariables = DashVariables> = {
  readonly key: string
  readonly sheet: DashStyleSheet
  readonly hash: (string: string) => string
  readonly stylis: typeof Stylis
  readonly cache: {
    [name: string]: string
  }
  readonly insert: (
    selector: string,
    name: string,
    styles: string,
    sheet: DashStyleSheet
  ) => void
  inserted: {
    [name: string]: number
  }
  variables: V
  readonly sheets: {
    [name: string]: {
      n: number
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
        container?.insertBefore(
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const safeHash = (key: string, hashFn: typeof hash) => {
  const hashCache: Record<string, string> = {}
  return (string: string) => {
    let value: string | undefined = hashCache[string]
    if (value) return value
    value = hashFn(string)
    // allows class names to start with numbers
    return (hashCache[string] =
      !key && !isNaN(value[0] as any) ? '_' + value : value)
  }
}

//
// Stylis plugins
const getServerCache = IS_BROWSER
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
  block && Sheet.current.insert(block + '}')
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
    let arg
    styles = {}

    for (; i < args.length; i++) {
      const toArg = typeof (arg = args[i])

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
  mangle?: CreateStylesOptions['mangleVariables'],
  names: string[] = []
): SerializedVariables => {
  const keys = Object.keys(vars)
  const variables: Record<string, any> = {}
  let css = ''
  let i = 0

  for (; i < keys.length; i++) {
    const key = keys[i]
    const value = vars[key]

    if (typeof value === 'object') {
      const result = serializeVariables(value, mangle, names.concat(key))
      variables[key] = result.variables
      css += result.css
    } else {
      let name = cssCase(
        names.length > 0 ? names.join('-') + '-' + key : key
      ).replace(cssDisallowedRe, '-')
      variables[key] = `var(${(name =
        '--' +
        (mangle === true || (mangle && !mangle[name])
          ? mangled(name)
          : name))})`
      css += `${name}:${value};`
    }
  }

  return {variables, css}
}

const mangled = safeHash('', hash)

type SerializedVariables = {
  readonly variables: Record<string, Record<string, any> | string | number>
  readonly css: string
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
const styles: Styles<DashVariables, ThemeNames> = createStyles()

export default styles
