export interface StylesResult {
  css: string
  names: string[]
}
export interface CreateStylesOptions {
  clearCache?: boolean
}
export declare const createStylesFromCache: (
  styles?: any,
  options?: CreateStylesOptions
) => StylesResult
export declare const createStyleTagFromCache: (
  styles?: any,
  options?: CreateStylesOptions
) => string
export interface WriteStylesOptions {
  name?: string
  hash?: (string: string) => string
  clearCache?: boolean
}
export interface WriteStylesResult {
  filename: string
  name: string
  path: string
  styles: string
}
export declare const writeStylesFromCache: (
  outputPath?: string,
  styles?: any,
  options?: WriteStylesOptions | undefined
) => Promise<WriteStylesResult>
export declare const createStylesFromString: (
  string: string,
  styles?: any,
  options?: CreateStylesOptions
) => StylesResult
export declare const createStyleTagFromString: (
  string: string,
  styles?: any,
  options?: CreateStylesOptions
) => string
export declare const writeStylesFromString: (
  string: string,
  outputPath?: string,
  styles?: any,
  options?: WriteStylesOptions | undefined
) => Promise<WriteStylesResult>
