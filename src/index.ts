// A huge amount of credit for this library goes to the emotion
// team and to Sebastian McKenzie at Facebook for inspiring the
// API design
import Stylis from '@emotion/stylis'
import type {Plugable, Plugin, Context} from '@emotion/stylis'
import unitless from '@emotion/unitless'
import memoize from 'trie-memoize'

//
// Constants
const __DEV__ =
  typeof process !== 'undefined' && process.env.NODE_ENV !== 'production'
const IS_BROWSER = typeof document !== 'undefined'
export type Falsy = false | 0 | null | undefined

//
// Hashing (fnv1a)
const OFFSET_BASIS_32 = 2166136261
export const fnvHash = (string: string): string => {
  let out = OFFSET_BASIS_32,
    i = 0,
    len = string.length

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
  readonly insert: (rule: string) => void
}

interface Sheet {
  current: CurrentSheet
}

const noop = () => {}
const Sheet: Sheet = {
  current: {
    insert: noop,
  },
}

const toSheet = (block: string) => {
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

//
// Configuration
const getServerStylisCache = IS_BROWSER
  ? null
  : // eslint-disable-next-line @typescript-eslint/no-unused-vars
    memoize([{}, WeakMap], (key: string, plugins: Plugable[]) => {
      const getCache = memoize([WeakMap], (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        prefix: boolean | ((key: string, value: any, context: any) => boolean)
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

export interface DashOptions<
  Vars extends DefaultVars = DefaultVars,
  ThemeNames extends string = Extract<keyof DefaultThemes, string>
> {
  readonly key?: string
  readonly nonce?: string
  readonly hash?: typeof fnvHash
  readonly stylisPlugins?: Plugable[]
  readonly prefix?:
    | boolean
    | ((key: string, value: any, context: any) => boolean)
  readonly container?: HTMLElement
  readonly speedy?: boolean
  readonly variables?: Vars
  readonly themes?: Themes<Vars, ThemeNames>
}

export type InsertCache = {
  [name: string]: number
}

export type VariableDefs =
  | {
      [name: string]: VariableDefs | string | number
    }
  | {
      [name: number]: VariableDefs | string | number
    }

export interface Variables {
  [name: string]: VariableDefs | string | number
}

export type StoredVariables = {
  [name: string]: any
}

export type GlobalCache = {
  [name: string]: {
    count: number
    sheet: DashStyleSheet
  }
}

export type StylisCache = {
  [name: string]: string
}

export type Themes<
  Vars extends DefaultVars = DefaultVars,
  ThemeNames extends string = Extract<keyof DefaultThemes, string>
> = {
  [Name in ThemeNames]: Vars
}

export type DashCache<
  Vars extends DefaultVars = DefaultVars,
  ThemeNames extends string = Extract<keyof DefaultThemes, string>
> = {
  readonly key: string
  readonly sheet: DashStyleSheet
  readonly hash: (string: string) => string
  readonly stylis: typeof Stylis
  readonly stylisCache: StylisCache
  readonly insert: (
    selector: string,
    name: string,
    styles: string,
    sheet: DashStyleSheet
  ) => void
  readonly insertCache: InsertCache
  variables: Vars
  readonly variablesCache: GlobalCache
  themes: Themes<Vars, ThemeNames>
  readonly globalCache: GlobalCache
  readonly clear: () => void
}

export const createDash = <
  Vars extends DefaultVars = DefaultVars,
  ThemeNames extends string = Extract<keyof DefaultThemes, string>
>(
  options: DashOptions<Vars, ThemeNames> = {}
): DashCache<Vars, ThemeNames> => {
  // Based on
  // https://github.com/emotion-js/emotion/blob/master/packages/cache/src/index.js
  let {
    key = '-ui',
    nonce,
    hash = fnvHash,
    stylisPlugins,
    prefix = true,
    container = IS_BROWSER ? document.head : void 0,
    speedy,
    variables = {} as Vars,
    themes = {} as Themes<Vars, ThemeNames>,
  } = options
  const stylis = new Stylis({prefix})
  speedy = speedy === void 0 || speedy === null ? !__DEV__ : speedy
  let insert: DashCache<Vars, ThemeNames>['insert'],
    insertCache = {},
    stylisCache: StylisCache = {}

  if (IS_BROWSER) {
    let nodes = document.querySelectorAll(`style[data-cache="${key}"]`),
      i = 0,
      j = 0

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
      Sheet.current = sheet
      insertCache[name] = 1
      stylis(selector, styles)
    }
  } else {
    // server side
    if (stylisPlugins || prefix !== void 0) stylis.use(stylisPlugins)
    stylisCache = (getServerStylisCache as any)(
      key,
      stylisPlugins || []
    )(prefix)

    insert = (selector, name, styles) => {
      if (insertCache[name]) return
      if (stylisCache[name] === void 0) {
        stylisCache[name] = stylis(selector, styles)
      }

      insertCache[name] = 1
    }
  }

  if (__DEV__) {
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
    hash: safeHash(key, hash),
    stylis,
    stylisCache,
    insert,
    insertCache,
    variables,
    variablesCache: {},
    themes,
    globalCache: {},
    clear() {
      this.insertCache = insertCache = {}
    },
  }
}

//
// Style sheets
export interface DashStyleSheet {
  // include all keys so it the object can be cloned via styleSheet(sheet)
  readonly key: string
  readonly nonce?: string
  readonly container?: HTMLElement
  readonly speedy: boolean
  readonly insert: (rule: string) => void
  readonly flush: () => void
}

export interface DashStyleSheetOptions {
  readonly key: string
  readonly container?: HTMLElement
  readonly nonce?: string
  readonly speedy: boolean
}

export const styleSheet = (options: DashStyleSheetOptions): DashStyleSheet => {
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
        let sheet: StyleSheet | CSSStyleSheet | null = tag.sheet,
          i = 0
        /* istanbul ignore next */
        if (!sheet) {
          // this weirdness brought to you by firefox
          for (; i < document.styleSheets.length; i++) {
            if (document.styleSheets[i].ownerNode === tag) {
              sheet = document.styleSheets[i]
              break
            }
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
    flush() {
      tags.forEach((tag) => (tag.parentNode as HTMLElement).removeChild(tag))
      tags.length = 0
      size = 0
    },
  }
}

//
// Style serialization
const isProcessableValue = (value?: boolean | null | string | number) =>
  value !== null && typeof value !== 'boolean'

const cssCaseRe = /[A-Z]|^ms/g

const cssCase = (string: string) =>
  string.replace(cssCaseRe, '-$&').toLowerCase()

const interpolate = (
  literals: TemplateStringsArray | string[],
  placeholders: string[]
) =>
  literals.reduce(
    (curr, next, i) => `${curr}${next}${placeholders[i] || ''}`,
    ''
  )

const isCustomProperty = (property: string) => property.charCodeAt(1) === 45

const styleName = (styleName: string): string =>
  isCustomProperty(styleName) ? styleName : cssCase(styleName)

const styleValue = (key: string, value: any): string =>
  unitless[key] !== 1 &&
  !isCustomProperty(key) &&
  typeof value === 'number' &&
  value !== 0
    ? `${value}px`
    : value

export type StyleObject = {
  [property: string]: StyleObject | string | number
}

const styleObjectToString = (object: StyleObject) => {
  let string = ''

  for (const key in object) {
    const value = object[key]
    if (typeof value === 'object' && value !== null)
      string += `${key}{${styleObjectToString(value)}}`
    else if (isProcessableValue(value))
      string += `${styleName(key)}:${styleValue(key, value)};`
  }

  return string
}

export type SerializedVariables<Vars extends DefaultVars = DefaultVars> = {
  readonly variables: Vars
  readonly styles: string
}

const serializeVariables = <Vars = DefaultVars>(
  vars: string | string[] | number | number[] | Vars,
  names?: string[]
): SerializedVariables<Vars> => {
  const keys = Object.keys(vars)
  const variables: Vars = {} as Vars
  let styles = '',
    i = 0

  for (; i < keys.length; i++) {
    const key = keys[i]
    const cssKey = cssCase(key)
    const value = vars[key]

    if (typeof value === 'object') {
      names = names || []
      const result = serializeVariables(value, names.concat(cssKey))
      variables[key] = result.variables
      styles += result.styles
    } else {
      let name = '--'

      if (names !== void 0 && names.length > 0) {
        name += names.join('-')
      }

      name += name === '--' ? cssKey : '-' + cssKey
      variables[key] = `var(${name})`
      styles += `${name}:${value};`
    }
  }

  return {variables, styles}
}

const mergeVariables = <Vars>(target: Vars, source: StoredVariables): Vars => {
  const next: Vars = Object.assign({}, target)

  for (const key in source) {
    const value = source[key]

    if (typeof value === 'object') {
      next[key] = mergeVariables(next[key] || {}, value)
    } else {
      next[key] = value
    }
  }

  return next
}

const minifyRe = [
  /\s{2,}|\n|\t/g,
  /([:;,([{}>~/])\s+/g,
  /\s+([;,)\]{}>~/!])/g,
  /(\/\*)\s+/g,
  /\s+(\*\/)/g,
]

export type StyleGetter<Vars = StoredVariables> = (
  variables: Vars
) => StyleObject | string

const normalizeStyles_ = <Vars extends DefaultVars = DefaultVars>(
  styles: string | StyleObject | StyleGetter<Vars>,
  variables: any
): string => {
  styles =
    typeof styles === 'function'
      ? normalizeStyles_<Vars>(styles(variables), variables)
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

function normalizeStyleObject<
  Names extends string,
  Vars extends DefaultVars = DefaultVars
>(
  dash: DashCache,
  styleDefs: StyleDefs<Names, Vars>,
  styleName?: string | Names | StyleObjectArgument<Names> | Falsy
): string

function normalizeStyleObject<
  Names extends string,
  Vars extends DefaultVars = DefaultVars
>(
  dash: DashCache,
  styleDefs: StyleObjectArgument<Names>,
  styleName?: string | Names | StyleObjectArgument<Names> | Falsy
): string

function normalizeStyleObject<
  Names extends string,
  Vars extends DefaultVars = DefaultVars
>(dash, styleDefs, styleName) {
  let nextStyles = styleDefs.default
    ? normalizeStyles<Vars>(styleDefs.default, dash.variables)
    : ''

  if (typeof styleName === 'string' && styleName !== 'default') {
    nextStyles += normalizeStyles<Vars>(styleDefs[styleName], dash.variables)
  } else if (typeof styleName === 'object' && styleName !== null) {
    for (const key in styleName)
      if (styleName[key] && key !== 'default')
        nextStyles += normalizeStyles<Vars>(styleDefs[key], dash.variables)

    nextStyles = normalizeStyles<Vars>(nextStyles, dash.variables)
  }

  return nextStyles
}

const normalizeArgs = <
  Names extends string,
  Vars extends DefaultVars = DefaultVars
>(
  dash: DashCache,
  styleDefs: StyleDefs<Names, Vars>,
  args: (string | Names | StyleObjectArgument<Names> | Falsy)[]
): string => {
  if (args.length > 1) {
    let argDefs: StyleObjectArgument<Names> = {},
      i = 0

    for (; i < args.length; i++) {
      const arg = args[i]

      if (typeof arg === 'string') {
        argDefs[arg as Names] = true
      } else if (typeof arg === 'object') {
        Object.assign(argDefs, arg)
      }
    }

    return normalizeStyleObject<Names, Vars>(dash, styleDefs, argDefs)
  }

  return normalizeStyleObject<Names, Vars>(dash, styleDefs, args[0])
}

const disallowedClassChars = /[^a-z0-9_-]/gi

export interface CSSFunction<Names extends string> {
  (...names: (Names | StyleObjectArgument<Names> | Falsy)[]): string
}

export interface EjectGlobal {
  (): void
}

export type StyleDefs<
  Names extends string,
  Vars extends DefaultVars = DefaultVars
> = {
  [Name in Names | 'default']?: string | StyleGetter<Vars> | StyleObject
}

export interface DefaultVars {}
export interface DefaultThemes {}

export interface Styles<
  Vars extends DefaultVars = DefaultVars,
  ThemeNames extends string = Extract<keyof DefaultThemes, string>
> {
  <Names extends string>(defs: StyleDefs<Names, Vars>): Style<Names, Vars>
  create: <
    T extends DefaultVars = Vars,
    U extends string = Extract<keyof DefaultThemes, string>
  >(
    options?: DashOptions<T, U>
  ) => Styles<T, U>
  one: (
    literals: TemplateStringsArray | string | StyleObject | StyleGetter<Vars>,
    ...placeholders: string[]
  ) => OneCallback
  variables: (vars: Vars, selector?: string) => EjectGlobal
  themes: (themes: Themes<Vars, ThemeNames>) => EjectGlobal
  theme: (name: ThemeNames) => string
  global: (
    literals: TemplateStringsArray | string | StyleGetter<Vars> | StyleObject,
    ...placeholders: string[]
  ) => EjectGlobal
  dash: DashCache<Vars, ThemeNames>
}

export type StyleObjectArgument<Names extends string> = {
  [Name in Names]?: boolean | null | undefined | string | number
}

export interface Style<
  Names extends string = string,
  Vars extends DefaultVars = DefaultVars
> {
  (...args: (Names | StyleObjectArgument<Names> | Falsy)[]): string
  css: CSSFunction<Names>
  styles: StyleDefs<Names, Vars>
}

export interface OneCallbackCss {
  (): string
  toString: () => string
}

export type OneCallback = {
  (createClassName?: boolean | number | string | null): string
  toString: () => string
  css: OneCallbackCss
}

//
// Where the magic happens
const createStyles = <
  Vars extends DefaultVars = DefaultVars,
  ThemeNames extends string = Extract<keyof DefaultThemes, string>
>(
  dash: DashCache<Vars, ThemeNames>
): Styles<Vars, ThemeNames> => {
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
      for (let i = 0; i < args.length; i++) {
        const arg = args[i]

        if (typeof arg === 'string') {
          name += `-${arg}`
        } else if (typeof arg === 'object') {
          const keys = Object.keys(arg).filter((k) => arg[k])

          if (keys.length) {
            name += `-${keys.join('-')}`
          }
        }
      }

      return name.replace(disallowedClassChars, '-')
    }
  }

  const styles: Styles<Vars, ThemeNames> = <Names extends string>(
    defs: StyleDefs<Names, Vars>
  ): Style<Names, Vars> => {
    //
    // style('text', 'space', {})
    const style: Style<Names, Vars> = (...args) => {
      const normalizedStyles = normalizeArgs<Names, Vars>(dash, defs, args)
      if (!normalizedStyles) return ''
      let name = hash(normalizedStyles)

      // explicit here on purpose so it's not in every test
      if (process.env.NODE_ENV === 'development') {
        name = addLabels(name, args)
      }

      const className = `${key}-${name}`
      insert(`.${className}`, name, normalizedStyles, sheet)

      return className
    }

    style.styles = defs
    style.css = (...names) => normalizeArgs<Names, Vars>(dash, defs, names)

    return style
  }

  //
  // Methods
  styles.create = (options) => createStyles(createDash(options))

  styles.one = (literals, ...placeholders): OneCallback => {
    const css = Array.isArray(literals)
      ? interpolate(literals, placeholders)
      : (literals as string | StyleGetter<Vars> | StyleObject)
    const style = styles<'default'>({default: css})
    const callback: OneCallback = (createClassName): string =>
      createClassName || createClassName === void 0 ? style() : ''

    callback.toString = callback
    callback.css = () => style.css('default')
    callback.css.toString = callback.css

    return callback
  }

  styles.variables = (vars, selector = ':root') => {
    const serialized = serializeVariables<Vars>(vars)
    const name = hash(serialized.styles)
    dash.variables = mergeVariables<Vars>(dash.variables, serialized.variables)
    variablesCache[name] = variablesCache[name] || {
      count: 0,
      sheet: styleSheet(sheet),
    }

    variablesCache[name].count += 1
    const variablesSheet = variablesCache[name].sheet
    insert(selector, name, serialized.styles, variablesSheet)

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
          : mergeVariables<Vars>(themes[name], nextThemes[name])
      ejectors.push(styles.variables(themes[name], `.${key}-${name}-theme`))
    }

    return () => ejectors.forEach((e) => e())
  }

  styles.theme = (theme) => `${key}-${theme}-theme`

  styles.global = (literals, ...placeholders) => {
    const styles = Array.isArray(literals)
      ? interpolate(literals, placeholders)
      : (literals as string | StyleGetter<Vars> | StyleObject)
    const normalizedStyles = normalizeStyles<Vars>(styles, dash.variables)

    if (!normalizedStyles) {
      return noop
    }

    const name = hash(normalizedStyles)
    globalCache[name] = globalCache[name] || {
      count: 0,
      sheet: styleSheet(sheet),
    }
    const globalSheet = globalCache[name].sheet

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

  if (Object.values(dash.variables).length) styles.variables(dash.variables)
  if (Object.values(themes).length) styles.themes(themes)
  styles.dash = dash

  return styles
}

//
// Creates default dash styles function
export const styles: Styles<
  DefaultVars,
  Extract<keyof DefaultThemes, string>
> = createStyles(createDash())
export default styles
