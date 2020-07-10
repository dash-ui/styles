export declare function hash(string: string): string
export declare function safeHash(
  key: string,
  hashFn: typeof hash
): (string: string) => string
export declare function noop(): void
