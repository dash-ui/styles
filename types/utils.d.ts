/**
 * An FNV-1a hashing algorithm with a 32-bit offset basis. FNV-1a hashes are designed
 * to be fast while maintaining a low collision rate. The high dispersion rate makes
 * them well-suited for hashing nearly identical strings.
 *
 * @param string - A string you want to hash
 */
export declare function hash(string: string): string;
export declare function safeHash(key: string, hashFn: typeof hash): (string: string) => string;
export declare function noop(): void;
