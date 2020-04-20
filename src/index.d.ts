import Stylis, {Plugable} from '@emotion/stylis'
declare type Falsy = false | 0 | null | undefined
export declare const fnvHash: (string: string) => string
export interface DashOptions<Vars, ThemeNames extends string> {
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
  readonly themes?: Themes<ThemeNames, Vars>
}
export declare type InsertCache = {
  [name: string]: number
}
export declare type Variables =
  | {
      [name: string]: Variables | string | number
    }
  | {
      [index: number]: Variables | string | number
    }
export declare type StoredVariables = {
  [name: string]: any
}
export declare type GlobalCache = {
  [name: string]: {
    count: number
    sheet: DashStyleSheet
  }
}
export declare type StylisCache = {
  [name: string]: string
}
export declare type Themes<ThemeNames extends string = string, Vars = any> = {
  [Name in ThemeNames]: Vars
}
export declare type DashCache<Vars = any, ThemeNames extends string = any> = {
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
  themes: Themes<ThemeNames, Vars>
  readonly globalCache: GlobalCache
  readonly clear: () => void
}
export declare const createDash: <
  Vars = any,
  ThemeNames extends string = string
>(
  options?: DashOptions<Vars, ThemeNames>
) => DashCache<Vars, ThemeNames>
export interface DashStyleSheet {
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
export declare const styleSheet: (
  options: DashStyleSheetOptions
) => DashStyleSheet
export declare type StyleObject = {
  [property: string]: StyleObject | string | number
}
export declare type SerializedVariables<Vars = any> = {
  readonly variables: Vars
  readonly styles: string
}
export declare type StyleGetter<Vars = StoredVariables> = (
  variables: Vars
) => StyleObject | string
export declare const normalizeStyles: <Vars = any>(
  styles: string | StyleObject | StyleGetter<Vars>,
  variables: any
) => string
export interface CSSFunction<Names extends string> {
  (...names: (Names | StyleObjectArgument<Names> | Falsy)[]): string
}
export interface EjectGlobal {
  (): void
}
export declare type StyleDefs<Names extends string, Vars> = {
  [Name in Names | 'default']?: string | StyleGetter<Vars> | StyleObject
}
export interface Styles<Vars = any, ThemeNames extends string = string> {
  <Names extends string>(defs: StyleDefs<Names, Vars>): Style<Names, Vars>
  create: <T = Vars, U extends string = ThemeNames>(
    options?: DashOptions<T, U>
  ) => Styles<T, U>
  one: (
    literals: TemplateStringsArray | string | StyleObject | StyleGetter<Vars>,
    ...placeholders: string[]
  ) => OneCallback
  variables: (vars: Vars, selector?: string) => EjectGlobal
  themes: (themes: Themes<ThemeNames, Vars>) => EjectGlobal
  theme: (name: ThemeNames) => string
  global: (
    literals: TemplateStringsArray | string | StyleGetter<Vars> | StyleObject,
    ...placeholders: string[]
  ) => EjectGlobal
  dash: DashCache<Vars, ThemeNames>
}
export declare type StyleObjectArgument<Names extends string> = {
  [Name in Names]?: boolean | null | undefined | string | number
}
export interface Style<Names extends string = string, Vars = any> {
  (...args: (Names | StyleObjectArgument<Names> | Falsy)[]): string
  css: CSSFunction<Names>
  styles: StyleDefs<Names, Vars>
}
export interface OneCallbackCss {
  (): string
  toString: () => string
}
export declare type OneCallback = {
  (createClassName?: boolean | number | string | null): string
  toString: () => string
  css: OneCallbackCss
}
export declare const styles: Styles<any, string>
export default styles
