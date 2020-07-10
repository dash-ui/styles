// A huge amount of credit for this library goes to the emotion
// team
import unitless from '@dash-ui/unitless'
import {safeHash, hash, noop} from './utils'
import {createDash, styleSheet} from './create-dash'
import type {
  Dash,
  CreateDashOptions,
  DashVariables,
  ThemeNames,
} from './create-dash'

/**
 * A function that returns a new `styles()` function with custom
 * options.
 *
 * @param options Configuration options
 */
export function createStyles<
  V extends DashVariables = DashVariables,
  T extends string = ThemeNames
>(options: CreateStylesOptions<V, T> = {}): Styles<V, T> {
  const dash = createDash(options)
  const {key, insert, inserted, hash, sheet, sheets} = dash
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

    // style('text', {})
    const style: Style<N, V> = function () {
      const css = compileArguments<N, V>(
        compiledStyleMap,
        dash.variables,
        arguments as any
      )
      if (!css) return ''
      let name = hash(css)

      /* istanbul ignore next */
      if (
        typeof process !== 'undefined' &&
        process.env.NODE_ENV === 'development'
      ) {
        name += label(arguments as any)
      }

      const className = key + '-' + name
      insert('.' + className, name, css)
      return className
    }

    style.styles = compiledStyleMap
    style.css = function () {
      return compileArguments<N, V>(
        compiledStyleMap,
        dash.variables,
        arguments as any
      )
    }
    return style
  }

  styles.one = function () {
    let one =
      typeof arguments[0] === 'function'
        ? arguments[0]
        : compileStyles<V>(
            compileLiterals.call(null, arguments),
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
      insert('.' + className, name, one)
      return className
    }

    ;(callback.css = css).toString = callback.css
    return (callback.toString = callback)
  }

  styles.cls = function () {
    // @ts-expect-error
    return styles.one.apply(this, arguments)()
  }

  styles.join = (...style) => {
    const css = style.join('')
    let name = hash(css)
    const className = key + '-' + name
    insert('.' + className, name, css)
    return className
  }

  styles.keyframes = function () {
    const css = compileStyles<V>(
      compileLiterals.call(null, arguments),
      dash.variables
    )
    const name = hash(css)
    const className = key + '-' + name
    insert('', name, `@keyframes ${className}{${css}}`)
    return className
  }

  styles.global = function () {
    const css = compileStyles<V>(
      compileLiterals.call(null, arguments),
      dash.variables
    )
    if (!css) return noop
    const name = hash(css)
    const cache = (sheets[name] = sheets[name] || {
      n: 0,
      sheet: styleSheet(sheet),
    })
    cache.n++
    insert('', name, css, cache.sheet)

    return () => {
      if (cache.n === 1) {
        delete inserted[name]
        delete sheets[name]
        cache.sheet.flush()
      } else {
        cache.n--
      }
    }
  }

  styles.variables = (variables, selector = ':root') => {
    const {css, vars} = serializeVariables(variables, options.mangleVariables)
    if (!css) return noop
    dash.variables = mergeVariables<V>(dash.variables, vars)
    return styles.global(selector + '{' + css + '}')
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
  T extends string = ThemeNames
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
   *
   * const Row = props => <div {...props} className={row()}/>>
   */
  one: (
    literals: TemplateStringsArray | string | StyleObject | StyleCallback<V>,
    ...placeholders: string[]
  ) => StylesOne
  cls: (
    literals: TemplateStringsArray | string | StyleObject | StyleCallback<V>,
    ...placeholders: string[]
  ) => string
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
>(styleMap: StyleMap<N, V>, variables: V, args: StyleArguments<N>): string {
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
  return (typeof value === 'object' && value !== null
    ? stringifyStyleObject(value)
    : // TypeScript w/o "strict": true throws here
      ((value || '') as string)
  )
    .trim()
    .replace(minSpace, ' ')
    .replace(minLeft, '$1')
    .replace(minRight, '$1')
}

function compileStylesMemo<
  N extends string,
  V extends DashVariables = DashVariables
>(styleMap: StyleMap<N, V>, key: N | 'default', variables: V): string {
  const styles = styleMap[key]
  return typeof styles === 'function'
    ? (styleMap[key] = compileStyles<V>(styles, variables))
    : (styles as string | Falsy) || ''
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
  target: V,
  source: {[name: string]: any}
): V {
  const next: any = Object.assign({}, target)

  for (const key in source) {
    const value = source[key]
    next[key] =
      typeof value === 'object' ? mergeVariables(next[key] || {}, value) : value
  }

  return next
}

//
// Creates and exports default dash styles function
const styles: Styles<DashVariables, ThemeNames> = createStyles()

export default styles
