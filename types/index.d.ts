import Stylis from '@dash-ui/stylis'
import type {Plugable} from '@dash-ui/stylis'
export declare const createStyles: <
  V extends DashVariables = DashVariables,
  T extends string = never
>(
  options?: CreateStylesOptions<V, T>
) => Styles<V, T>
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
export declare type StyleMap<
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
export declare type StylesOne = {
  (createClassName?: boolean | number | string | null): string
  toString: () => string
  css: {
    (): string
    toString: () => string
  }
}
declare type DeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends Record<string, unknown>
  ? {
      [P in keyof T]?: DeepPartial<T[P]>
    }
  : T
export declare const createDash: <V extends DashVariables = DashVariables>(
  options?: CreateDashOptions<V>
) => Dash<V>
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
export declare type Dash<V extends DashVariables = DashVariables> = {
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
    sheet?: DashStyleSheet
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
export interface DashStyleSheetOptions {
  readonly key: string
  readonly container?: HTMLElement
  readonly nonce?: string
  readonly speedy: boolean
}
export interface DashStyleSheet {
  readonly key: string
  readonly nonce?: string
  readonly container?: HTMLElement
  readonly speedy: boolean
  readonly insert: (rule: string) => void
  readonly flush: () => void
}
export declare type Falsy = false | 0 | null | undefined
export declare const hash: (string: string) => string
export declare const compileStyles: <V extends DashVariables = DashVariables>(
  styles:
    | string
    | false
    | 0
    | StyleObject
    | StyleCallback<V>
    | null
    | undefined,
  variables: V
) => string
export interface DashVariables {}
export interface DashThemes {}
export declare type ThemeNames = Extract<keyof DashThemes, string>
declare const styles: Styles<DashVariables, ThemeNames>
export default styles
