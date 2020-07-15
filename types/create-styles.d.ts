import type {Dash, CreateDashOptions} from './create-dash'
/**
 * A factory function that returns a new `styles` instance with
 * your custom configuration options.
 *
 * @param options Configuration options
 */
export declare function createStyles<
  V extends DashVariables = DashVariables,
  T extends string = DashThemeNames
>(options?: CreateStylesOptions<V, T>): Styles<V, T>
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
export declare type Style<
  N extends string = string,
  V extends DashVariables = DashVariables
> = {
  (...args: StyleArguments<N>): string
  css(...names: StyleArguments<N>): string
  styles: StyleMap<N, V>
}
export declare type StylesOne = {
  (createClassName?: boolean | number | string | null): string
  css(): string
}
export declare type StyleMap<
  N extends string,
  V extends DashVariables = DashVariables
> = {
  [Name in N | 'default']?: StyleValue<V>
}
export declare type StyleArguments<N extends string = string> = (
  | N
  | {
      [Name in N]?: boolean | null | undefined | string | number
    }
  | Falsy
)[]
export declare type StyleValue<V extends DashVariables = DashVariables> =
  | string
  | StyleCallback<V>
  | StyleObject
export declare type StyleObject = {
  [property: string]: StyleObject | string | number
}
export declare type StyleCallback<V extends DashVariables = DashVariables> = (
  variables: V
) => StyleObject | string
declare type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends Record<string, unknown>
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T
export declare type Falsy = false | 0 | null | undefined
export declare function compileStyles<V extends DashVariables = DashVariables>(
  styles: StyleValue<V> | Falsy,
  variables: V
): string
export declare const styles: Styles<DashVariables, DashThemeNames>
export interface DashVariables {}
export interface DashThemes {}
export declare type DashThemeNames = Extract<keyof DashThemes, string>
export {}