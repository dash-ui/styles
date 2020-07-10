export function hash(string: string): string {
  // fnv1a hash
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

export function safeHash(key: string, hashFn: typeof hash) {
  const hashCache: Record<string, string> = {}
  let value: string | undefined
  return (string: string) => {
    if ((value = hashCache[string])) return value
    value = hashFn(string)
    // allows class names to start with numbers
    return (hashCache[string] =
      !key && !isNaN(value[0] as any) ? '_' + value : value)
  }
}

export function noop() {}
