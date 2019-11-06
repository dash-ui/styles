// A huge amount (almost all) of credit for this library goes to the emotion
// team for the core functionality and to Sebastian McKenzie at Facebook for
// inspiring the API design
import Stylis from '@emotion/stylis'
import hash from '@emotion/hash'
import unitless from '@emotion/unitless'
import memoize from 'trie-memoize'

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

function ruleSheet(
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
) {
  switch (context) {
    // property
    case 1: {
      switch (content.charCodeAt(0)) {
        case 64: {
          // @import
          Sheet.current.insert(content + ';')
          return ''
        }
        // charcode for l
        case 108: {
          // charcode for b
          // this ignores label
          if (content.charCodeAt(2) === 98) return ''
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

      for (let i = 0; i < contents.length; i++) toSheet(contents)
    }
  }
}

const removeLabel = (context, content) =>
  context === 1 &&
  // charcode for l
  content.charCodeAt(0) === 108 &&
  // charcode for b
  content.charCodeAt(2) === 98
    ? // this ignores label
      ''
    : void 0

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

export function configure(options = {}) {
  // lifted from
  // https://github.com/emotion-js/emotion/blob/master/packages/cache/src/index.js
  let {
    key = '-ui',
    nonce,
    stylisPlugins,
    prefix = true,
    container = IS_BROWSER && document.head,
    speedy,
  } = options
  const stylis = new Stylis({prefix})
  speedy = speedy === void 0 || speedy === null ? false : !__DEV__
  let insert,
    inserted = {}

  if (IS_BROWSER) {
    container = container || document.head
    const nodes = document.querySelectorAll(`style[data-ui-${key}]`)

    Array.prototype.forEach.call(nodes, node => {
      const attrib = node.getAttribute(`data-ui-${key}`)
      attrib.split(' ').forEach(id => {
        inserted[id] = true
      })

      if (node.parentNode !== container) {
        container.appendChild(node)
      }
    })

    stylis.use(stylisPlugins)(ruleSheet)

    insert = (selector, serialized, sheet, shouldCache) => {
      let name = serialized.name
      Sheet.current = sheet

      if (__DEV__) {
        if (serialized.map !== void 0) {
          let map = serialized.map

          Sheet.current = {
            insert: rule => {
              sheet.insert(rule + map)
            },
          }
        }
      }
      stylis(selector, serialized.styles)
      if (shouldCache) {
        cache.inserted[name] = true
      }
    }
  } else {
    stylis.use(removeLabel)
    let serverStylisCache = rootServerStylisCache

    if (stylisPlugins || prefix !== void 0) {
      stylis.use(stylisPlugins)
      serverStylisCache = getServerStylisCache(
        stylisPlugins || rootServerStylisCache
      )(prefix)
    }

    let getRules = (selector, serialized) => {
      let name = serialized.name

      if (serverStylisCache[name] === void 0) {
        serverStylisCache[name] = stylis(selector, serialized.styles)
      }

      return serverStylisCache[name]
    }

    insert = (selector, serialized, sheet, shouldCache) => {
      let name = serialized.name
      let rules = getRules(selector, serialized)

      if (cache.compat === false) {
        // in regular mode, we don't set the styles on the inserted cache
        // since we don't need to and that would be wasting memory
        // we return them so that they are rendered in a style tag
        if (shouldCache) {
          cache.inserted[name] = true
        }

        if (
          // using === development instead of !== production
          // because if people do ssr in tests, the source maps showing up would be annoying
          process.env.NODE_ENV === 'development' &&
          serialized.map !== void 0
        ) {
          return rules + serialized.map
        }

        return rules
      } else {
        // in compat mode, we put the styles on the inserted cache so
        // that ssr can pull out the styles
        // except when we don't want to cache it which was in Global but now
        // is nowhere but we don't want to do a major right now
        // and just in case we're going to leave the case here
        // it's also not affecting client side bundle size
        // so it's really not a big deal
        if (shouldCache) {
          cache.inserted[name] = rules
        } else {
          return rules
        }
      }
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

  const cache = {
    key,
    sheet: styleSheet({
      key,
      container,
      nonce,
      speedy,
    }),
    nonce,
    compat: false,
    insert,
    inserted,
    registered: {},
  }

  return cache
}

//
// Style sheets
function styleSheet({key, container, nonce, speedy}) {
  // Based off emotion and glamor's StyleSheet
  let size = 0,
    before,
    tags = []

  return {
    insert(rule) {
      // the max length is how many rules we have per style tag, it's 65000 in speedy mode
      // it's 1 in dev because we insert source maps that map a single rule to a location
      // and you can only have one source map per style tag
      if (size % (speedy ? 65000 : 1) === 0) {
        let tag = document.createElement('style')
        tag.setAttribute('data-ui', key)
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
            // @import is generally only used for font faces from google fonts and etc.
            // so while this could be technically correct then it would be slower and larger
            // for a tiny bit of correctness that won't matter in the real world
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
/*
function getRegisteredStyles(registered, registeredStyles, classNames) {
  let rawClassName = ''

  classNames.split(' ').forEach(className => {
    if (registered[className] !== void 0) {
      registeredStyles.push(registered[className])
    } else {
      rawClassName += `${className} `
    }
  })

  return rawClassName
}
*/
const insertStyles = (cache, serialized, isStringTag) => {
  // lifted from https://github.com/emotion-js/emotion/tree/master/packages/cache
  let className = `${cache.key}-${serialized.name}`

  if (
    // we only need to add the styles to the registered cache if the
    // class name could be used further down
    // the tree but if it's a string tag, we know it won't
    // so we don't have to add it to registered cache.
    // this improves memory usage since we can avoid storing the whole style string
    (isStringTag === false ||
      // we need to always store it if we're in compat mode and
      // in node since ssr relies on whether a style is in
      // the registered cache to know whether a style is global or not
      // also, note that this check will be dead code eliminated in the browser
      (IS_BROWSER === false && cache.compat !== false)) &&
    cache.registered[className] === void 0
  ) {
    cache.registered[className] = serialized.styles
  }

  if (cache.inserted[serialized.name] === void 0) {
    let stylesForSSR = ''
    let current = serialized

    do {
      let maybeStyles = cache.insert(
        `.${className}`,
        current,
        cache.sheet,
        true
      )
      if (!IS_BROWSER && maybeStyles !== void 0) {
        stylesForSSR += maybeStyles
      }

      current = current.next
    } while (current !== void 0)

    if (!IS_BROWSER && stylesForSSR.length !== 0) {
      return stylesForSSR
    }
  }
}

const isCustomProperty = property => property.charCodeAt(1) === 45
const isProcessableValue = value => value !== null && typeof value !== 'boolean'
let hyphenateRegex = /[A-Z]|^ms/g
// let animationRegex = /_EMO_([^_]+?)_([^]*?)_EMO_/g
// let cursor

const styleName = memoize([{}], styleName =>
  isCustomProperty(styleName)
    ? styleName
    : styleName.replace(hyphenateRegex, '-$&').toLowerCase()
)

let styleValue = (key, value) => {
  /*
  switch (key) {
    case 'animation':
    case 'animationName': {
      if (typeof value === 'string') {
        return value.replace(animationRegex, (match, p1, p2) => {
          cursor = {
            name: p1,
            styles: p2,
            next: cursor
          }
          return p1
        })
      }
    }
  }
  */
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

const styleObjectToString = object => {
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
}

function serialize() {

}

function styles() {
  console.log(arguments)
  if (arguments.length === 1) {
    // unroll
  } else {
    // do a loop
  }
}

export const css = styles => {
  if (Array.isArray(styles)) {
    let nextStyles = ''

    for (let i = 0; i < styles.length; i++) {
      const style = styles[i]
      if (typeof style === 'object') {
        nextStyles += styleObjectToString(style)
      } else {
        nextStyles += style
      }
    }

    styles = nextStyles
  } else if (typeof styles === 'object') {
    styles = styleObjectToString(styles)
  }

  return styles
}

export default styles
