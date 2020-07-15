// A huge amount of credit for this library goes to the emotion
// team
import unitless from '@dash-ui/unitless'
import {safeHash, hash, noop} from './utils'
import {createDash, styleSheet} from './create-dash'
import type {Dash, CreateDashOptions} from './create-dash'

/**
 * A factory function that returns a new `styles` instance with
 * your custom configuration options.
 *
 * @param options Configuration options
 */
export function createStyles<
  V extends DashVariables = DashVariables,
  T extends string = DashThemeNames
>(options: CreateStylesOptions<V, T> = {}): Styles<V, T> {
  const dash = createDash(options)
  const {key, insert, inserted, hash, sheet, sheets} = dash
  const themes = Object.assign({}, options.themes)
  const variables = Object.assign({}, options.variables)
  let label: (args: any[]) => string
  // explicit here on purpose so it's not in every test
  /* istanbul ignore next */
  if (
    typeof process !== 'undefined' &&
    process.env.NODE_ENV === 'development'
  ) {
    label = (args) => {
      // add helpful labels to the name in development
      return [...args]
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

  const styles: Styles<V, T> = <N extends string>(
    styleMap: StyleMap<N, V>
  ): Style<N, V> => {
    // We are mutating this object via memoization so we need to create
    // a mutable copy
    const compiledStyleMap: StyleMapMemo<N, V> = new Map()
    let styleKey: keyof typeof styleMap
    let styleVal: StyleValue<V> | undefined
    /* istanbul ignore next */
    for (styleKey in styleMap)
      compiledStyleMap.set(
        styleKey,
        typeof (styleVal = styleMap[styleKey]) !== 'function'
          ? compileStyles(styleVal, variables)
          : (styleVal as StyleCallback<V>)
      )

    // style('text', {})
    function style() {
      const css = compileArguments<N, V>(
        compiledStyleMap,
        variables,
        arguments as any
      )
      if (!css) return ''
      let name = hash(css)
      /* istanbul ignore next */
      if (label !== undefined) name += label(arguments as any)

      const className = key + '-' + name
      insert('.' + className, name, css)
      return className
    }

    style.styles = styleMap
    style.css = function () {
      return compileArguments<N, V>(
        compiledStyleMap,
        variables,
        arguments as any
      )
    }

    return style
  }

  styles.one = function () {
    let one =
      typeof arguments[0] === 'function'
        ? arguments[0]
        : compileStyles<V>(compileLiterals.call(null, arguments), variables)

    const css = () =>
      typeof one === 'string' ? one : (one = compileStyles<V>(one, variables))
    let name: string
    let className: string

    const callback: StylesOne = (createClassName) => {
      if (!createClassName && createClassName !== void 0) return ''
      const one = css()
      className = className || key + '-' + (name = name || hash(one))
      insert('.' + className, name, one)
      return className
    }

    callback.css = css
    return callback
  }

  styles.cls = function () {
    // @ts-expect-error
    return styles.one.apply(this, arguments)()
  }

  styles.join = function () {
    const css = Array.prototype.slice.call(arguments).join('')
    let name = hash(css)
    const className = key + '-' + name
    insert('.' + className, name, css)
    return className
  }

  styles.keyframes = function () {
    const css = compileStyles<V>(
      compileLiterals.call(null, arguments),
      variables
    )
    const name = hash(css)
    const animationName = key + '-' + name
    insert('', name, `@keyframes ${animationName}{${css}}`)
    return animationName
  }

  styles.insertGlobal = function () {
    const css = compileStyles<V>(
      compileLiterals.call(null, arguments),
      variables
    )
    if (!css) return noop
    const name = hash(css)
    const cache = sheets.get(name) || {
      n: 0,
      sheet: styleSheet(sheet),
    }
    sheets.set(name, cache)
    cache.n++
    insert('', name, css, cache.sheet)

    return () => {
      if (cache.n === 1) {
        inserted.delete(name)
        sheets.delete(name)
        cache.sheet.flush()
      } else {
        cache.n--
      }
    }
  }

  styles.insertVariables = (nextVariables, selector = ':root') => {
    const {css, vars} = serializeVariables(
      nextVariables,
      options.mangleVariables
    )
    if (!css) return noop
    mergeVariables<V>(variables, vars)
    return styles.insertGlobal(selector + '{' + css + '}')
  }

  styles.insertThemes = (nextThemes) => {
    const ejectors: (() => void)[] = []

    for (const name in nextThemes) {
      ejectors.push(
        styles.insertVariables(
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
  styles.dash = dash
  styles.insertVariables(variables as any)
  styles.insertThemes(themes as any)
  return styles
}

export interface CreateStylesOptions<
  V extends DashVariables = DashVariables,
  T extends string = DashThemeNames
> extends CreateDashOptions {
  variables?: V
  themes?: {
    [Name in T]: V
  }
  /**
   * When `true` this will mangle CSS variable names. You can also
   * provide an object with `{key: boolean}` pairs of reserved keys
   * which will not be mangled.
   */
  mangleVariables?: boolean | Record<string, boolean>
}

/**
 * A styles object
 */
export interface Styles<
  V extends DashVariables = DashVariables,
  T extends string = DashThemeNames
> {
  <N extends string>(styleMap: StyleMap<N, V>): Style<N, V>
  /**
   * A function that accepts a tagged template literal, style object, or style callback,
   * and returns a function. That function inserts the style into a `<style>` tag and
   * returns a class name when called. The caching algorithm for this function is O(1)
   * and this is the most performant way to create styles.
   *
   * @example
   * const row = styles.one`
   *   display: flex;
   *   flex-wrap: nowrap;
   * `
   * const Row = props => <div {...props} className={row()}/>>
   */
  one(
    literals: TemplateStringsArray | string | StyleObject | StyleCallback<V>,
    ...placeholders: string[]
  ): StylesOne
  cls(
    literals: TemplateStringsArray | string | StyleObject | StyleCallback<V>,
    ...placeholders: string[]
  ): string
  /**
   * Joins CSS, inserts it into the DOM, and returns a class name.
   *
   * @example
   * <div
   *   className={styles.join(
   *     button.css('primary'),
   *     transition.css('fade')
   *   )}
   * />
   */
  join(...styleCss: string[]): string
  keyframes(
    literals: TemplateStringsArray | string | StyleCallback<V> | StyleObject,
    ...placeholders: string[]
  ): string
  theme(name: T): string
  insertVariables(variables: DeepPartial<V>, selector?: string): () => void
  insertThemes(
    themes: DeepPartial<
      {
        [Name in T]: V
      }
    >
  ): () => void
  insertGlobal(
    literals: TemplateStringsArray | string | StyleCallback<V> | StyleObject,
    ...placeholders: string[]
  ): () => void
  dash: Dash
}

export type Style<
  N extends string = string,
  V extends DashVariables = DashVariables
> = {
  (...args: StyleArguments<N>): string
  css(...names: StyleArguments<N>): string
  styles: StyleMap<N, V>
}

export type StylesOne = {
  (createClassName?: boolean | number | string | null): string
  css(): string
}

export type StyleMap<
  N extends string,
  V extends DashVariables = DashVariables
> = {
  [Name in N | 'default']?: StyleValue<V>
}

type StyleMapMemo<
  N extends string,
  V extends DashVariables = DashVariables
> = Map<N | 'default', StyleCallback<V> | string>

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

type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends Record<string, unknown>
  ? {[P in keyof T]?: DeepPartial<T[P]>}
  : T

//
// Utils
export type Falsy = false | 0 | null | undefined

//
// Style serialization
function compileArguments<
  N extends string,
  V extends DashVariables = DashVariables
>(styleMap: StyleMapMemo<N, V>, variables: V, args: StyleArguments<N>): string {
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

  let nextStyles = styleMap.get('default')
    ? compileStylesMemo<N, V>(styleMap, 'default', variables)
    : ''

  if (typeof styles === 'string') {
    nextStyles += compileStylesMemo<N, V>(styleMap, styles, variables)
  } else if (typeof styles === 'object' && styles !== null) {
    for (const key in styles)
      if (styles[key])
        nextStyles += compileStylesMemo<N, V>(styleMap, key, variables)
  }

  return nextStyles
}

const minSpace = /\s{2,}/g
const minLeft = /([:;,([{}>~/]|\/\*)\s/g
const minRight = /\s([;,)\]{}>~/!]|\*\/)/g

export function compileStyles<V extends DashVariables = DashVariables>(
  styles: StyleValue<V> | Falsy,
  variables: V
): string {
  const value = typeof styles === 'function' ? styles(variables) : styles
  return typeof value === 'object' && value !== null
    ? stringifyStyleObject(value)
    : // TypeScript w/o "strict": true throws here
      ((value || '') as string)
        .trim()
        .replace(minSpace, ' ')
        .replace(minLeft, '$1')
        .replace(minRight, '$1')
}

function compileStylesMemo<
  N extends string,
  V extends DashVariables = DashVariables
>(styleMap: StyleMapMemo<N, V>, key: N | 'default', variables: V): string {
  let styles = styleMap.get(key)
  if (typeof styles === 'function')
    styleMap.set(key, (styles = compileStyles<V>(styles, variables)))
  return styles || ''
}

function stringifyStyleObject(object: StyleObject) {
  let string = ''

  for (const key in object) {
    const value = object[key]
    const toV = typeof value
    if (value === null || toV === 'boolean') continue
    if (toV === 'object') {
      string += key + '{' + stringifyStyleObject(value as StyleObject) + '}'
    } else {
      const isCustom = key.charCodeAt(1) === 45
      string += `${isCustom ? key : cssCase(key)}:${
        toV !== 'number' ||
        unitless[key as keyof typeof unitless] === 1 ||
        value === 0 ||
        isCustom
          ? value
          : value + 'px'
      };`
    }
  }

  return string
}

function compileLiterals(args: IArguments) {
  const literals = args[0]
  return Array.isArray(literals)
    ? literals.reduce((curr, next, i) => curr + next + (args[i + 1] || ''), '')
    : literals
}

//
// Variable and theme serialization
const cssCaseRe = /[A-Z]|^ms/g
const cssDisallowedRe = /[^\w-]/g
const cssCase = (string: string) =>
  string.replace(cssCaseRe, '-$&').toLowerCase()

function serializeVariables(
  variables: Record<string, any>,
  mangle?: CreateStylesOptions['mangleVariables'],
  names: string[] = []
): SerializedVariables {
  const keys = Object.keys(variables)
  const vars: Record<string, any> = {}
  let css = ''
  let i = 0

  for (; i < keys.length; i++) {
    const key = keys[i]
    const value = variables[key]

    if (typeof value === 'object') {
      const result = serializeVariables(value, mangle, names.concat(key))
      vars[key] = result.vars
      css += result.css
    } else {
      let name = cssCase(
        names.length > 0 ? names.join('-') + '-' + key : key
      ).replace(cssDisallowedRe, '-')
      vars[key] = `var(${(name =
        '--' +
        (mangle === true || (mangle && !mangle[name])
          ? mangled(name)
          : name))})`
      css += `${name}:${value};`
    }
  }

  return {vars, css}
}

const mangled = safeHash('', hash)

type SerializedVariables = {
  readonly vars: Record<string, Record<string, any> | string | number>
  readonly css: string
}

function mergeVariables<V extends DashVariables = DashVariables>(
  target: Record<string, any>,
  source: Record<string, any>
): V {
  for (const key in source) {
    const value = source[key]
    target[key] =
      typeof value === 'object'
        ? mergeVariables(target[key] || {}, value)
        : value
  }

  return target as V
}

//
// Creates and exports default dash styles function
export const styles: Styles<DashVariables, DashThemeNames> = createStyles()

//
// Variables and themes defined in user space
export interface DashVariables {}
export interface DashThemes {}
export type DashThemeNames = Extract<keyof DashThemes, string>
