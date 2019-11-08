// A huge amount (almost all) of credit for this library goes to the emotion
// team for the core functionality and to Sebastian McKenzie at Facebook for
// inspiring the API design
import Stylis from '@emotion/stylis'
import hash_ from '@emotion/hash'
import unitless from '@emotion/unitless'
import memoize from 'trie-memoize'
const hash = memoize([{}], hash_)

//
// Constants
const IS_BROWSER = typeof document !== 'undefined'

//
// Stylis plugins
// https://github.com/thysultan/stylis.js/tree/master/plugins/rule-sheet
const RULE_DELIMITER = '/*|*/'
const RULE_NEEDLE = RULE_DELIMITER + '}'

const Sheet = {
  current: null,
}

const toSheet = block => {
  block && Sheet.current.insert(block + '}')
}

const ruleSheet = (
  context,
  content,
  selectors,
  parents,
  line,
  column,
  length,
  ns,
  depth,
  at
) => {
  switch (context) {
    // property
    case 1: {
      switch (content.charCodeAt(0)) {
        case 64: {
          // @import
          Sheet.current.insert(content + ';')
          return ''
        }
      }
      break
    }
    // selector
    case 2: {
      if (ns === 0) return content + RULE_DELIMITER
      break
    }
    // at-rule
    case 3: {
      switch (ns) {
        // @font-face, @page
        case 102:
        case 112: {
          Sheet.current.insert(selectors[0] + content)
          return ''
        }
        default: {
          return content + (at === 0 ? RULE_DELIMITER : '')
        }
      }
    }
    case -2: {
      const contents = content.split(RULE_NEEDLE)
      for (let i = 0; i < contents.length; i++) toSheet(contents[i])
    }
  }
}

//
// Configuration
let rootServerStylisCache = {}
let getServerStylisCache = IS_BROWSER
  ? void 0
  : memoize([WeakMap], () => {
      let getCache = memoize([WeakMap], () => ({}))
      let prefixTrueCache = {}
      let prefixFalseCache = {}

      return prefix => {
        if (prefix === void 0 || prefix === true) {
          return prefixTrueCache
        }

        if (prefix === false) {
          return prefixFalseCache
        }

        return getCache(prefix)
      }
    })

const configure = (options = {}) => {
  // lifted from
  // https://github.com/emotion-js/emotion/blob/master/packages/cache/src/index.js
  let {
    key = 'dash',
    nonce,
    stylisPlugins,
    prefix = true,
    container = IS_BROWSER && document.head,
    speedy,
  } = options
  const stylis = new Stylis({prefix})
  speedy = speedy === void 0 || speedy === null ? !__DEV__ : speedy
  let insert,
    values = {}

  if (IS_BROWSER) {
    const nodes = document.querySelectorAll(`style[data-${key}]`)

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      const attr = node.getAttribute(`data-${key}`)
      const ids = attr.split(' ')
      for (let i = 0; i < ids.length; i++) values[ids[i]] = true

      if (node.parentNode !== container) {
        container.appendChild(node)
      }
    }

    stylis.use(stylisPlugins)(ruleSheet)

    insert = (selector, name, styles, sheet, shouldCache) => {
      if (cache.values[name] === true) return
      Sheet.current = sheet

      if (__DEV__) {
        /*
        if (serialized.map !== void 0) {
          let map = serialized.map

          Sheet.current = {
            insert: rule => {
              sheet.insert(rule + map)
            },
          }
        }
        */
      }

      stylis(selector, styles)
      if (shouldCache) cache.values[name] = true
    }
  } else {
    // server side
    let serverStylisCache = rootServerStylisCache

    if (stylisPlugins || prefix !== void 0) {
      stylis.use(stylisPlugins)
      serverStylisCache = getServerStylisCache(
        stylisPlugins || rootServerStylisCache
      )(prefix)
    }

    insert = (selector, name, styles, sheet, shouldCache) => {
      if (cache.values[name]) return
      let rules = serverStylisCache[name]

      if (serverStylisCache[name] === void 0) {
        rules = serverStylisCache[name] = stylis(selector, styles)
      }

      if (shouldCache) cache.values[name] = rules
      return rules
    }
  }

  if (__DEV__) {
    const commentStart = /\/\*/g
    const commentEnd = /\*\//g

    stylis.use((context, content) => {
      if (context === -1) {
        while (commentStart.test(content)) {
          commentEnd.lastIndex = commentStart.lastIndex

          if (commentEnd.test(content)) {
            commentStart.lastIndex = commentEnd.lastIndex
            continue
          }

          throw new Error(
            'Your styles have an unterminated comment ("/*" without ' +
              'corresponding "*/").'
          )
        }

        commentStart.lastIndex = 0
      }
    })
  }

  let cache = {
    key,
    sheet: styleSheet({
      key,
      container,
      nonce,
      speedy,
    }),
    insert,
    values,
    clear() {
      this.values = values = {}
    },
  }

  return cache
}

//
// Style sheets
const styleSheet = ({key, container, nonce, speedy}) => {
  // Based off emotion and glamor's StyleSheet
  let size = 0,
    before,
    tags = []

  return {
    nonce,
    insert(rule) {
      // the max length is how many rules we have per style tag, it's 65000 in
      // speedy mode it's 1 in dev because we insert source maps that map a
      // single rule to a location and you can only have one source map per
      // style tag
      if (size % (speedy ? 65000 : 1) === 0) {
        let tag = document.createElement('style')
        tag.setAttribute(`data-dash`, key)
        if (nonce !== void 0) tag.setAttribute('nonce', nonce)
        tag.appendChild(document.createTextNode(''))

        let insertBefore
        if (tags.length === 0) {
          insertBefore = before
        } else {
          insertBefore = tags[tags.length - 1].nextSibling
        }
        container.insertBefore(tag, insertBefore)
        tags.push(tag)
      }
      const tag = tags[tags.length - 1]

      if (speedy) {
        let sheet = tag.sheet

        if (!sheet) {
          // this weirdness brought to you by firefox
          for (let i = 0; i < document.styleSheets.length; i++) {
            if (document.styleSheets[i].ownerNode === tag) {
              sheet = document.styleSheets[i]
              break
            }
          }
        }

        try {
          // this is a really hot path
          // we check the second character first because having "i"
          // as the second character will happen less often than
          // having "@" as the first character
          let isImportRule =
            rule.charCodeAt(1) === 105 && rule.charCodeAt(0) === 64
          // this is the ultrafast version, works across browsers
          // the big drawback is that the css won't be editable in devtools
          sheet.insertRule(
            rule,
            // we need to insert @import rules before anything else
            // otherwise there will be an error
            // technically this means that the @import rules will
            // _usually_(not always since there could be multiple style tags)
            // be the first ones in prod and generally later in dev
            // this shouldn't really matter in the real world though
            // @import is generally only used for font faces from google fonts
            // and etc. so while this could be technically correct then it
            // would be slower and larger for a tiny bit of correctness that
            // won't matter in the real world
            isImportRule ? 0 : sheet.cssRules.length
          )
        } catch (e) {
          if (__DEV__) {
            console.warn(
              `There was a problem inserting the following rule: "${rule}"`,
              e
            )
          }
        }
      } else {
        tag.appendChild(document.createTextNode(rule))
      }

      size++
    },
    flush() {
      for (let i = 0; i < tags.length; i++) {
        tags[i].parentNode.removeChild(tags[i])
      }

      tags.length = 0
      size = 0
    },
  }
}

//
// Style serialization
const isCustomProperty = property => property.charCodeAt(1) === 45
const isProcessableValue = value => value !== null && typeof value !== 'boolean'
let hyphenateRegex = /[A-Z]|^ms/g
const interpolate = args => {
  let strings = args[0]
  if (typeof args[0] === 'string') return strings
  let str = '';
  // eslint-disable-next-line
  const [_, ...values] = args
  for (let i = 0; i < strings.length; i++) str += strings[i] + (values[i] || '')
  return str;
}

const styleName = memoize([{}], styleName =>
  isCustomProperty(styleName)
    ? styleName
    : styleName.replace(hyphenateRegex, '-$&').toLowerCase()
)

let styleValue = (key, value) => {
  if (
    unitless[key] !== 1 &&
    !isCustomProperty(key) &&
    typeof value === 'number' &&
    value !== 0
  ) {
    return `${value}px`
  }

  return value
}

const styleObjectToString = memoize([WeakMap], object => {
  let keys = Object.keys(object),
    string = '',
    i = 0

  for (; i < keys.length; i++) {
    const key = keys[i]
    const value = object[key]
    if (isProcessableValue(value))
      string += `${styleName(key)}:${styleValue(key, value)};`
  }

  return string
})

const serialize = (call, styles) => {
  if (typeof styles === 'function') {
    return serialize(call, styles(call))
  } else if (typeof styles === 'object') {
    styles = styleObjectToString(styles)
  }

  styles = styles || ''
  return styles
}

//
// Where the magic happens
const createStyles = cache => {
  function styles() {
    let defs = arguments[0],
      addLabels
    // explicit here on purpose so it's not in every test
    if (process.env.NODE_ENV === 'development') {
      addLabels = (name, args) => {
        // add helpful labels to the name in development
        for (let i = 0; i < args.length; i++) {
          const arg = args[i]
          if (typeof arg === 'string') name += `-${arg}`
          else if (typeof arg === 'object') {
            const keys = Object.keys(arg).filter(k => arg[k])
            if (keys.length) name += `-${keys.join('-')}`
          }
        }

        return name
      }
    }

    if (arguments.length > 1) {
      defs = Object.assign({}, ...arguments)
    }

    function serializeToSelector() {
      let name = hash(serializeStyles.apply(null, arguments))
      name = `.${cache.key}-${name}`
      // explicit here on purpose so it's not in every test
      if (process.env.NODE_ENV === 'development') {
        if (name) {
          name = addLabels(name, arguments)
        }
      }
      return name ? name : name
    }

    function serializeStyles(getter) {
      if (typeof getter === 'string') {
        return serialize(serializeToSelector, defs[getter])
      } else if (typeof getter === 'object') {
        let keys = Object.keys(getter),
          nextStyles = ''

        for (let i = 0; i < keys.length; i++) {
          if (getter[keys[i]]) {
            nextStyles += serialize(serializeToSelector, defs[keys[i]])
          }
        }

        return serialize(serializeToSelector, nextStyles)
      }
    }

    return function style() {
      let serializedStyles

      if (arguments.length > 1) {
        const styleDefs = {}

        for (let i = 0; i < arguments.length; i++) {
          const arg = arguments[i]

          if (typeof arg === 'string') styleDefs[arg] = true
          else if (typeof arg === 'object') Object.assign(styleDefs, arg)
        }

        serializedStyles = serializeStyles(styleDefs)
      } else {
        serializedStyles = serializeStyles(arguments[0])
      }

      if (!serializedStyles) return ''
      let name = hash(serializedStyles)
      // explicit here on purpose so it's not in every test
      if (process.env.NODE_ENV === 'development') {
        name = addLabels(name, arguments)
      }
      let className = `${cache.key}-${name}`
      cache.insert(`.${className}`, name, serializedStyles, cache.sheet, true)
      return className
    }
  }

  styles.configure = options => {
    const cache = configure(options)
    return createStyles(cache)
  }

  styles.extract = (clear = true) => {
    if (__DEV__) {
      if (IS_BROWSER)
        throw new Error('styles.extract() only works in node environments')
    }

    const keys = Object.keys(cache.values)
    let output = ''

    for (let i = 0; i < keys.length; i++) output += cache.values[keys[i]]

    if (clear) cache.clear()
    return output
  }

  styles.extractTags = (clear = true) => {
    if (__DEV__) {
      if (IS_BROWSER)
        throw new Error('styles.extractTags() only works in node environments')
    }

    const nonceString = cache.sheet.nonce ? ` nonce="${cache.sheet.nonce}"` : ''
    let output = ''
    // explicit check here for test envs
    if (process.env.NODE_ENV === 'development') {
      // uses separate tags in dev
      const keys = Object.keys(cache.values)

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        output +=
          `<style data-${cache.key}="${key}"${nonceString}>` +
          cache.values[key] +
          `</style>`
      }
    } else {
      // uses one tag in prod
      const names = Object.keys(cache.values).join(' ')
      output =
        `<style data-${cache.key}="${names}"${nonceString}>` +
        styles.extract(false) +
        `</style>`
    }

    if (clear) cache.clear()
    return output
  }

  styles.global = function () {
    let styles = serialize(null, interpolate(arguments))
    if (!styles) return ''
    cache.insert('', `global-${hash(styles)}`, styles, cache.sheet, true)
  }

  styles.cache = cache
  styles.sheet = cache.sheet
  return styles
}

// Creates an initial cache
export default createStyles(configure())
