// A huge amount of credit for this library goes to the emotion
// team
import unitless from '@dash-ui/unitless'
import {safeHash, hash as fnv1aHash, noop} from './utils'
import {createDash} from './create-dash'
import type {Dash} from './create-dash'

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
  const dash = options.dash || createDash()
  const {key, insert, sheets} = dash
  const themes = {} as Record<T, V>
  const variables = {} as V
  const hash = safeHash(key, options.hash || fnv1aHash)

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
      insert(name, '.' + className, css)
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
      insert(name, '.' + className, one)
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
    insert(name, '.' + className, css)
    return className
  }

  styles.keyframes = function () {
    const css = compileStyles<V>(
      compileLiterals.call(null, arguments),
      variables
    )
    const name = hash(css)
    const animationName = key + '-' + name
    insert(name, '', `@keyframes ${animationName}{${css}}`)
    return animationName
  }

  styles.insertGlobal = function () {
    const css = compileStyles<V>(
      compileLiterals.call(null, arguments),
      variables
    )

    if (!css) return noop
    const name = hash(css)
    insert(name, '', css, sheets.add(name))
    return () => sheets.delete(name)
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
  styles.hash = hash
  styles.insertVariables(options.variables || ({} as any))
  styles.insertThemes(options.themes || ({} as any))
  return styles
}

export interface CreateStylesOptions<
  V extends DashVariables = DashVariables,
  T extends string = DashThemeNames
> {
  /**
   * An instance of dash created by the `createDash()` factory
   * @default createDash()
   */
  dash?: Dash
  /**
   * Inserts CSS variables into the DOM and makes them available for use in
   * style callbacks. The name of the CSS variables is automatically generated
   * based upon the depth of the mapping i.e. `foo.bar.baz` -> `--foo-bar-baz`.
   *
   * @example
   * const styles = createStyles({
   *   variables: {
   *     color: {
   *       // var(--color-light-red)
   *       lightRed: '#c17'
   *     }
   *   }
   * })
   *
   * const bgRed = styles.one(({color}) => ({
   *   backgroundColor: color.lightRed
   * }))
   *
   * const Component = () => <div className={bgRed()} />
   */
  readonly variables?: V
  /**
   * A mapping of theme name/CSS variable pairs.
   *
   * This Creates a CSS variable-based theme by defining variables within a
   * class name selector matching the theme name. Apart from that it works
   * the same way `variables` does.
   *
   * @example
   * const styles = createStyles({
   *   themes: {
   *     // .ui-light
   *     light: {
   *       // var(--background-color)
   *       backgroundColor: '#fff'
   *     },
   *     // .ui-dark
   *     dark: {
   *       // var(--background-color)
   *       backgroundColor: '#000'
   *     }
   *   }
   * })
   *
   * // CSS variables in the 'dark' theme take precedence in this component
   * const App = () => <div className={styles.theme('dark)}/>
   */
  readonly themes?: {
    [Name in T]: V
  }
  /**
   * When `true` this will mangle CSS variable names. You can also
   * provide an object with `{key: boolean}` pairs of reserved keys
   * which will not be mangled.
   *
   * @example
   * const styles = createStyles({
   *   // All CSS variables will be mangled in production
   *   mangleVariables: process.env.NODE_ENV === 'production'
   * })
   *
   * @example
   * const styles = createStyles({
   *   mangleVariables: {
   *     // --vh will not be mangled
   *     vh: true
   *   }
   * })
   */
  readonly mangleVariables?: boolean | Record<string, boolean>
  /**
   * Use your own hash function for creating selector names. By default
   * Dash uses an fnv1a hashing algorithm.
   */
  readonly hash?: typeof fnv1aHash
}

/**
 * `styles()` is a function for composing style definitions in a
 * deterministic way. It returns a function which when called will insert
 * your styles into the DOM and create a unique class name.
 *
 * It also has several utility methods attached to it
 * which accomplish everything you need to scale an application
 * using CSS-in-JS.
 *
 * @param styleMap A style name/value mapping
 *
 * @example
 * const bg = styles({
 *   // Define styles using an object
 *   blue: {
 *     backgroundColor: 'blue'
 *   },
 *   // Access stored CSS variables when a callback is provided as
 *   // the value
 *   red: ({colors}) => `
 *     background-color: ${colors.red};
 *   `,
 *   // Define styles using a string
 *   green: `
 *     background-color: green;
 *   `
 * })
 *
 * // This component will have a "red" background
 * const Component = () => <div className={bg('blue', 'red')}/>
 *
 * // This component will have a "blue" background
 * const Component = () => <div className={bg('red', 'blue')}/>
 *
 * // This component will have a "green" background
 * const Component = () => <div className={bg({red: true, green: true})}/>
 */
export interface Styles<
  V extends DashVariables = DashVariables,
  T extends string = DashThemeNames
> {
  <N extends string>(styleMap: StyleMap<N, V>): Style<N, V>
  /**
   * A function that accepts a tagged template literal, style object, or style callback,
   * and returns a function. That function inserts the style into a `<style>` tag and
   * returns a class name when called.
   *
   * @example
   * const row = styles.one`
   *   display: flex;
   *   flex-wrap: nowrap;
   * `
   * const Row = props => <div {...props} className={row()}/>>
   * // This will not insert the styles if `isRow` is `false`
   * const RowSometimes = ({isRow = false}) => <div className={row(isRow)}/>>
   */
  one(
    literals: TemplateStringsArray | string | StyleObject | StyleCallback<V>,
    ...placeholders: string[]
  ): StylesOne
  /**
   * A function that accepts a tagged template literal, style object, or style callback.
   * Calling this will immediately insert the CSS into the DOM and return a unique
   * class name for the styles. This is a shortcut for `styles.one('display: flex;')()`.
   *
   * @example
   * const Component = () => <div className={styles.cls`display: flex;`}/>
   */
  cls(
    literals: TemplateStringsArray | string | StyleObject | StyleCallback<V>,
    ...placeholders: string[]
  ): string
  /**
   * Joins CSS, inserts it into the DOM right away, and returns a class name.
   *
   * @example
   * const Component = () => <div
   *   className={styles.join(
   *     button.css('primary'),
   *     transition.css('fade'),
   *     'display: block;'
   *   )}
   * />
   */
  join(...styleCss: string[]): string
  /**
   * A function that accepts a tagged template literal, style object, or style callback.
   * Using this will immediately insert a global `@keyframes` defintion into the DOM and
   * return the name of the keyframes instance.
   *
   * @example
   * const fadeIn = styles.keyframes`
   *   from {
   *     opacity: 0;
   *   }
   *
   *   to {
   *     opactity: 1
   *   }
   * `
   */
  keyframes(
    literals: TemplateStringsArray | string | StyleCallback<V> | StyleObject,
    ...placeholders: string[]
  ): string
  /**
   * A function that returns the generated class name for a given theme when
   * using `insertThemes()` to create CSS variable-based themes.
   *
   * @param name The name of the theme
   *
   * @example
   * styles.insertThemes({
   *  dark: {
   *    color: {
   *      background: '#000'
   *    }
   *  }
   * })
   *
   * const Component = () => <div className={styles.theme('dark')}/>
   */
  theme(name: T): string
  /**
   * Inserts CSS variables into the DOM and makes them available for use in
   * style callbacks. The name of the CSS variables is automatically generated
   * based upon the depth of the mapping i.e. `foo.bar.baz` -> `--foo-bar-baz`.
   * This function returns a function that will eject the styles inserted by
   * `insertVariables()` when it is called.
   *
   * @param variables A map of CSS variable name/value pairs
   * @param selector Including a selector will only make these CSS variable
   *   definitions take effect within the selector, e.g. a class name or ID. By
   *   default the selector is `":root"`.
   *
   * @example
   * // Inserts CSS variables into the document `:root`
   * styles.insertVariables({
   *   color: {
   *     // var(--color-indigo)
   *     indigo: '#5c6ac4',
   *     // var(--color-blue)
   *     blue: '#007ace',
   *     // var(--color-red)
   *     red: '#de3618',
   *   }
   * })
   *
   * // Overrides the above when they are used within a `.dark` selector
   * const ejectVariables = styles.insertVariables(
   *   {
   *     color: {
   *       // var(--color-indigo)
   *       indigo: '#5c6ac4',
   *       // var(--color-blue)
   *       blue: '#007ace',
   *       // var(--color-red)
   *       red: '#de3618',
   *     }
   *   },
   *   '.dark'
   * )
   */
  insertVariables(variables: DeepPartial<V>, selector?: string): () => void
  /**
   * Creates a CSS variable-based theme by defining variables within a
   * class name selector matching the theme name. Apart from that it works
   * the same way `insertVariables()` does. This function returns a function
   * that will eject the styles inserted by `insertVariables()` when it is called.
   *
   * @param themes A mapping of theme name/CSS variable pairs.
   *
   * @example
   * const ejectThemes = styles.insertThemes({
   *   // .ui-light
   *   light: {
   *     // var(--background-color)
   *     backgroundColor: '#fff'
   *   },
   *   // .ui-dark
   *   dark: {
   *     // var(--background-color)
   *     backgroundColor: '#000'
   *   }
   * })
   *
   * // "dark" css variables will take precedence within this component
   * const Component = () => <div className={styles.theme('dark)}/>
   */
  insertThemes(
    themes: DeepPartial<
      {
        [Name in T]: V
      }
    >
  ): () => void
  /**
   * A function that accepts a tagged template literal, style object, or style callback.
   * Using this will immediately insert styles into the DOM relative to the root document.
   * This function returns a function that will eject the styles inserted by
   * `insertGlobal()` when it is called.
   *
   * @example
   * const ejectGlobal = styles.insertGlobal(({color}) => `
   *   body {
   *     background-color: ${color.primaryBg};
   *   }
   * `)
   */
  insertGlobal(
    literals: TemplateStringsArray | string | StyleCallback<V> | StyleObject,
    ...placeholders: string[]
  ): () => void
  /**
   * A hashing function for creating unique selector names
   * @param string The string you'd like to create a unique has of
   */
  hash(string: string): string
  /**
   * The instance of underlying the Dash cache used by this instance. This was
   * automatically created by `createDash()` when `createStyles()` was called.
   * Dash controls the caching, style sheets, auto-prefixing, and DOM insertion
   * that happens in the `styles()` instance.
   */
  dash: Dash
}

/**
 * A function that inserts styles from the style map into the DOM when called
 * with those style names selected.
 *
 * @param args A series of style names or style name/boolean maps which
 *  select the styles from the style map you want to compose into a singular
 *  deterministic style and class name.
 *
 * @example
 * const style = styles({
 *   block: 'display: block',
 *   w100: 'width: 100px;',
 *   h100: 'height: 100px',
 * })
 *
 * // display: block; height: 100px; width: 100px;
 * const Component = () => <div className={style('block', 'h100', 'w100')}/>
 */
export type Style<N extends string, V extends DashVariables = DashVariables> = {
  (...args: StyleArguments<N>): string
  /**
   * A function that returns the raw, minified CSS string for a given
   * name in the style map.
   *
   * @param names A series of style names or style name/boolean maps which
   *  select the styles from the style map you want to compose into a singular
   *  CSS string.
   *
   * @example
   * const style = styles({
   *   block: 'display: block',
   *   w100: 'width: 100px;',
   *   h100: 'height: 100px',
   * })
   *
   * const someOtherStyle = styles({
   *   // display: block; height: 100px; width: 100px;
   *   default: style.css('block', 'h100', 'w100')
   * })
   */
  css(...names: StyleArguments<N>): string
  /**
   * The style map that this `style()` instance was instantiated with.
   */
  styles: StyleMap<N, V>
}

/**
 * A function that inserts styles into the DOM when called without
 * a falsy value. If the first argument is falsy, the styles will
 * not be inserted and a class name will not be returned.
 */
export type StylesOne = {
  (createClassName?: boolean | number | string | null): string
  /**
   * A method that returns a minified CSS string of the styles defined
   * in the `styles.one()` that generated this callback.
   */
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

export type StyleArguments<N extends string> = (
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

const minLeft = /([:;,([{}>~/\s]|\/\*)\s+/g
const minRight = /\s+([:;,)\]{}>~/!]|\*\/)/g

/**
 * A utility function that will turn style objects and callbacks into
 * minified strings. It will also minify strings it receives.
 *
 * @param styles A style callback, object, or string
 * @param variables A map of CSS variables accessible by style callbacks
 */
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

const mangled = safeHash('', fnv1aHash)

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
// Creates and exports default styles() instance
export const styles: Styles<DashVariables, DashThemeNames> = createStyles()

/**
 * These are CSS variable type definitions that tell functions like
 * style callbacks which variables are available. They can be defined
 * globally in your application like so:
 *
 * @example
 * declare module '＠dash-ui/styles' {
 *   export interface DashVariables {
 *     color: {
 *       red: string
 *     }
 *   }
 * }
 *
 * They can also be created automatically when you use a `createStyles()` factory.
 *
 * @example
 * const styles = createStyles({
 *   variables: {
 *     foo: 'bar',
 *     bar: 'baz'
 *   }
 * })
 *
 * // "foo" | "bar"
 * type Level1VariableNames = keyof DashVariables
 */
export interface DashVariables {}

/**
 * These are CSS variable theme type definitions that tell functions like
 * style callbacks which variables are available and which themes are available in
 * `styles.theme()`. They can be defined globally in your application like so:
 *
 * @example
 * declare module '＠dash-ui/styles' {
 *   export interface DashThemes {
 *     light: {
 *       color: {
 *         red: string;
 *       }
 *     }
 *     dark: {
 *       color: {
 *         red: string;
 *       }
 *     }
 *   }
 * }
 */
export interface DashThemes {}

/**
 * The names of the themes defined in the `DashThemes` type
 */
export type DashThemeNames = Extract<keyof DashThemes, string>
