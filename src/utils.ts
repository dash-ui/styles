/**
 * An FNV-1a hashing algorithm with a 32-bit offset basis. FNV-1a hashes are designed
 * to be fast while maintaining a low collision rate. The high dispersion rate makes
 * them well-suited for hashing nearly identical strings.
 *
 * @param string A string you want to hash
 */
export function hash(string: string): string {
  let out = 2166136261 // 32-bit offset basis
  let i = 0
  let len = string.length

  for (; i < len; ++i)
    out =
      (out ^= string.charCodeAt(i)) +
      (out << 1) +
      (out << 4) +
      (out << 7) +
      (out << 8) +
      (out << 24)

  return (out >>> 0).toString(36)
}

const minL = /(^|[:;,{}\s])\s+|$/g
const minR = / +{/g

export function safeHash(key: string, hashFn: typeof hash) {
  const hashCache = new Map<string, string>()
  let value: string | undefined
  return (string: string) => {
    if ((value = hashCache.get(string))) return value
    value = hashFn(string.replace(minL, '$1').replace(minR, '{'))
    // allows class names to start with numbers
    hashCache.set(
      string,
      (value = !key && !isNaN(value[0] as any) ? '_' + value : value)
    )
    return value
  }
}

export function noop() {}
