import type {
  PropertiesFallback as CSSProperties,
  Pseudos as CSSPseudos,
  HtmlAttributes as CSSHTMLAttributes,
  SvgAttributes as CSSSvgAttributes,
} from 'csstype'
import {hash as fnv1aHash} from './utils'
import type {Dash} from './create-dash'
/**
 * A factory function that returns a new `styles` instance with
 * your custom configuration options.
 *
 * @param options Configuration options
 */
export declare function createStyles<
  V extends DashTokens = DashTokens,
  T extends string = DashThemeNames
>(options?: CreateStylesOptions<V, T>): Styles<V, T>
export interface CreateStylesOptions<
  V extends DashTokens = DashTokens,
  T extends string = DashThemeNames
> {
  /**
   * An instance of dash created by the `createDash()` factory
   * @default createDash()
   */
  dash?: Dash
  /**
   * Inserts CSS tokens into the DOM and makes them available for use in
   * style callbacks. The name of the CSS tokens is automatically generated
   * based upon the depth of the mapping i.e. `foo.bar.baz` -> `--foo-bar-baz`.
   *
   * @example
   * const styles = createStyles({
   *   tokens: {
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
  readonly tokens?: V
  /**
   * A mapping of theme name/CSS variable pairs.
   *
   * This Creates a CSS variable-based theme by defining tokens within a
   * class name selector matching the theme name. Apart from that it works
   * the same way `tokens` does.
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
   * // CSS tokens in the 'dark' theme take precedence in this component
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
   *   // All CSS tokens will be mangled in production
   *   mangleTokens: process.env.NODE_ENV === 'production'
   * })
   *
   * @example
   * const styles = createStyles({
   *   mangleTokens: {
   *     // --vh will not be mangled
   *     vh: true
   *   }
   * })
   */
  readonly mangleTokens?: boolean | Record<string, boolean>
  /**
   * Use your own hash function for creating selector names. By default
   * Dash uses an fnv1a hashing algorithm.
   */
  readonly hash?: typeof fnv1aHash
}
/**
 * `styles()` is a function for composing styles in a
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
 *   // Access stored CSS tokens when a callback is provided as
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
  V extends DashTokens = DashTokens,
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
   * A function that uses lazy evalution to create styles with indeterminate values.
   * Calling this will immediately insert the CSS into the DOM and return a unique
   * class name for the styles.
   *
   * @example
   * const lazyWidth = styles.lazy((width) => ({
   *   width
   * }))
   * const Component = ({width = 200}) => <div className={lazyWidth(width)}/>>
   */
  lazy<Value extends LazyValue>(
    lazyFn: (value: Value) => string | StyleCallback<V> | StyleObject
  ): StylesLazy<Value>
  /**
   * A function that joins CSS strings, inserts them into the DOM right away, and returns a class name.
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
  join(...css: string[]): string
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
   * Inserts CSS tokens into the DOM and makes them available for use in
   * style callbacks. The name of the CSS tokens is automatically generated
   * based upon the depth of the mapping i.e. `foo.bar.baz` -> `--foo-bar-baz`.
   * This function returns a function that will flush the styles inserted by
   * `insertTokens()` when it is called.
   *
   * @param tokens A map of CSS variable name/value pairs
   * @param selector Including a selector will only make these CSS variable
   *   definitions take effect within the selector, e.g. a class name or ID. By
   *   default the selector is `":root"`.
   *
   * @example
   * // Inserts CSS tokens into the document `:root`
   * styles.insertTokens({
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
   * const flushTokens = styles.insertTokens(
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
  insertTokens(tokens: DeepPartial<V>, selector?: string): () => void
  /**
   * Creates a CSS variable-based theme by defining tokens within a
   * class name selector matching the theme name. Apart from that it works
   * the same way `insertTokens()` does. This function returns a function
   * that will flush the styles inserted by `insertTokens()` when it is called.
   *
   * @param themes A mapping of theme name/CSS variable pairs.
   *
   * @example
   * const flushThemes = styles.insertThemes({
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
   * // "dark" css tokens will take precedence within this component
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
   * This function returns a function that will flush the styles inserted by
   * `insertGlobal()` when it is called.
   *
   * @example
   * const flushGlobal = styles.insertGlobal(({color}) => `
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
   * The CSS tokens currently defined in the instance
   */
  tokens: V
  /**
   * A hashing function for creating unique selector names
   * @param string The string you'd like to hash
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
export declare type Style<
  N extends string,
  V extends DashTokens = DashTokens
> = {
  (...args: StyleArguments<N>): string
  /**
   * A function that returns the raw, CSS string for a given
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
export declare type StylesOne = {
  (createClassName?: boolean | number | string | null): string
  /**
   * A method that returns a CSS string if the first argument is not falsy.
   */
  css(createCss?: boolean | number | string | null): string
}
export declare type StyleMap<
  N extends string,
  V extends DashTokens = DashTokens
> = {
  [Name in N | 'default']?: StyleValue<V>
}
export declare type StyleArguments<N extends string> = (
  | N
  | {
      [Name in N]?: boolean | null | undefined | string | number
    }
  | Falsy
)[]
export declare type StyleValue<V extends DashTokens = DashTokens> =
  | string
  | StyleCallback<V>
  | StyleObject
declare type KnownStyles = {
  [property in keyof CSSProperties]?:
    | CSSProperties[property]
    | (string & {})
    | (number & {})
}
declare type PseudoStyles = {
  [property in CSSPseudos | CSSHTMLAttributes | CSSSvgAttributes]?: StyleObject
}
declare type SelectorStyles = {
  [property: string]:
    | string
    | number
    | KnownStyles
    | PseudoStyles
    | SelectorStyles
}
export declare type StyleObject = KnownStyles & PseudoStyles & SelectorStyles
export declare type StyleCallback<V extends DashTokens = DashTokens> = (
  tokens: V
) => StyleObject | string
declare type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends Record<string, unknown>
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T
export declare type LazyValue =
  | string
  | number
  | null
  | undefined
  | boolean
  | (string | number | null | undefined | boolean | LazyValue)[]
  | {
      [key: string]: LazyValue
    }
/**
 * A function that inserts indeterminate styles based on the value
 * into the DOM when called.
 *
 * @param value A JSON serializable value to create indeterminate
 *   styles from
 */
export declare type StylesLazy<Value extends LazyValue> = {
  (value?: Value): string
  /**
   * A method that returns indeterminate CSS strings based on the value
   * when called.
   *
   * @param value A JSON serializable value to create indeterminate
   *   styles from
   */
  css(value?: Value): string
}
export declare type Falsy = false | 0 | null | undefined
/**
 * A utility function that will compile style objects and callbacks into CSS strings.
 *
 * @param styles A style callback, object, or string
 * @param tokens A map of CSS tokens for style callbacks
 */
export declare function compileStyles<V extends DashTokens = DashTokens>(
  styles: StyleValue<V> | Falsy,
  tokens?: V
): string
export declare const styles: Styles<DashTokens, DashThemeNames>
/**
 * These are CSS variable type definitions that tell functions like
 * style callbacks which tokens are available. They can be defined
 * globally in your application like so:
 *
 * @example
 * declare module '＠dash-ui/styles' {
 *   export interface DashTokens {
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
 *   tokens: {
 *     foo: 'bar',
 *     bar: 'baz'
 *   }
 * })
 *
 * // "foo" | "bar"
 * type Level1VariableNames = keyof DashTokens
 */
export interface DashTokens {}
/**
 * These are CSS variable theme type definitions that tell functions like
 * style callbacks which tokens are available and which themes are available in
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
export declare type DashThemeNames = Extract<keyof DashThemes, string>
export {}
