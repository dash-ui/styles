import Stylis from '@dash-ui/stylis'
import type {Plugable} from '@dash-ui/stylis'
import {hash} from './utils'
export declare function createDash<V extends DashVariables = DashVariables>(
  options?: CreateDashOptions<V>
): Dash<V>
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
  readonly cache: Map<string, string>
  readonly insert: (
    selector: string,
    name: string,
    styles: string,
    sheet?: DashStyleSheet
  ) => void
  readonly inserted: Set<string>
  variables: V
  readonly sheets: Map<string, DashSheet>
  readonly clear: () => void
}
interface DashSheet {
  n: number
  sheet: DashStyleSheet
}
export declare function styleSheet(
  options: DashStyleSheetOptions
): DashStyleSheet
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
export interface DashVariables {}
export interface DashThemes {}
export declare type ThemeNames = Extract<keyof DashThemes, string>
export {}
