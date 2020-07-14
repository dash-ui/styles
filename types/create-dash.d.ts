import Stylis from '@dash-ui/stylis'
import type {Plugable} from '@dash-ui/stylis'
import {hash} from './utils'
export declare function createDash(options?: CreateDashOptions): Dash
export interface CreateDashOptions {
  readonly key?: string
  readonly nonce?: string
  readonly hash?: typeof hash
  readonly stylisPlugins?: Plugable[]
  readonly prefix?:
    | boolean
    | ((key: string, value: any, context: any) => boolean)
  readonly container?: HTMLElement
  readonly speedy?: boolean
}
export declare type Dash = {
  readonly key: string
  readonly sheet: DashStyleSheet
  hash(string: string): string
  readonly stylis: typeof Stylis
  readonly cache: Map<string, string>
  insert(
    selector: string,
    name: string,
    styles: string,
    sheet?: DashStyleSheet
  ): void
  readonly inserted: Set<string>
  readonly sheets: Map<string, DashSheet>
  clear(): void
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
  insert(rule: string): void
  flush(): void
}
export {}
