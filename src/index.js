// A huge amount (almost all) of credit for this library goes to the emotion
// team for the core functionality and to Sebastian McKenzie at Facebook for
// inspiring the API design
import Stylis from '@emotion/stylis'
import unitless from '@emotion/unitless'
import memoize from 'trie-memoize'

//
// Constants
const IS_BROWSER = typeof document !== 'undefined'

//
// Hashing (fnv1a)
const OFFSET_BASIS_32 = 2166136261
export const fnvHash = memoize([{}], string => {
  let out = OFFSET_BASIS_32,
    i = 0,
    len = string.length
  for (; i < len; ++i) {
    out ^= string.charCodeAt(i)
    out += (out << 1) + (out << 4) + (out << 7) + (out << 8) + (out << 24)
  }
  return (out >>> 0).toString(36)
})

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
  // property
  if (context === 1) {
    if (content.charCodeAt(0) === 64) {
      // @import
      Sheet.current.insert(content + ';')
      return ''
    }
  }
  // selector
  else if (context === 2) {
    if (ns === 0) return content + RULE_DELIMITER
  }
  // at-rule
  else if (context === 3) {
    // @font-face, @page
    if (ns === 102 || ns === 112) {
      Sheet.current.insert(selectors[0] + content)
      return ''
    } else return content + (at === 0 ? RULE_DELIMITER : '')
  } else if (context === -2) {
    const contents = content.split(RULE_NEEDLE)
    for (let i = 0; i < contents.length; i++) toSheet(contents[i])
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

export const createDash = (options = {}) => {
  // lifted from
  // https://github.com/emotion-js/emotion/blob/master/packages/cache/src/index.js
  let {
    key = 'dash',
    nonce,
    hash = fnvHash,
    stylisPlugins,
    prefix = true,
    container = IS_BROWSER && document.head,
    speedy,
  } = options
  const stylis = new Stylis({prefix})
  speedy = speedy === void 0 || speedy === null ? !__DEV__ : speedy
  let insert,
    insertCache = {},
    stylisCache

  if (IS_BROWSER) {
    const nodes = document.querySelectorAll(`style[data-${key}]`)

    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]
      const attr = node.getAttribute(`data-${key}`)
      const ids = attr.split(' ')
      for (let i = 0; i < ids.length; i++) insertCache[ids[i]] = 1

      if (node.parentNode !== container) {
        container.appendChild(node)
      }
    }

    stylis.use(stylisPlugins)(ruleSheet)

    insert = (selector, name, styles, sheet) => {
      if (dash.insertCache[name] === 1) return
      Sheet.current = sheet
      dash.insertCache[name] = 1
      stylis(selector, styles)
    }
  } else {
    // server side
    stylisCache = rootServerStylisCache

    if (stylisPlugins || prefix !== void 0) {
      stylis.use(stylisPlugins)
      stylisCache = getServerStylisCache(
        stylisPlugins || rootServerStylisCache
      )(prefix)
    }

    insert = (selector, name, styles) => {
      if (dash.insertCache[name]) return
      if (stylisCache[name] === void 0) {
        stylisCache[name] = stylis(selector, styles)
      }
      dash.insertCache[name] = 1
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

  let dash = {
    key,
    sheet: styleSheet({
      key,
      container,
      nonce,
      speedy,
    }),
    hash,
    stylis,
    stylisCache,
    insert,
    insertCache,
    variables: {},
    variablesCache: [],
    themes: {},
    globalCache: [],
    clear() {
      this.insertCache = insertCache = {}
    },
  }

  return dash
}

//
// Style sheets
export const styleSheet = ({key, container, nonce, speedy}) => {
  // Based off emotion and glamor's StyleSheet
  let size = 0,
    before,
    tags = []

  return {
    // include all keys so it the object can be cloned via styleSheet(sheet)
    key,
    nonce,
    container,
    speedy,
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
let cssCaseRe = /[A-Z]|^ms/g
const cssCase = string => string.replace(cssCaseRe, '-$&').toLowerCase()
const interpolate = args => {
  let strings = args[0]
  if (typeof strings === 'string') return strings
  if (!strings) return ''
  let str = ''
  // eslint-disable-next-line
  const [_, ...values] = Array.prototype.slice.call(args)
  for (let i = 0; i < strings.length; i++) str += strings[i] + (values[i] || '')
  return str
}

const styleName = memoize([{}], styleName =>
  isCustomProperty(styleName) ? styleName : cssCase(styleName)
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

const serializeVariables_ = (prefix, vars, names) => {
  const keys = Object.keys(vars)
  const variables = {}
  let styles = ''

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]
    const cssKey = cssCase(key)
    const value = vars[key]

    if (typeof value === 'object') {
      names = names || []
      const result = serializeVariables_(prefix, value, names.concat(cssKey))
      variables[key] = result.variables
      styles += result.styles
    } else {
      let name = `--${prefix}`
      if (names !== void 0 && names.length > 0) name += `-${names.join('-')}`
      name += name === '--' ? cssKey : `-${cssKey}`
      variables[key] = `var(${name})`
      styles += `${name}:${value};`
    }
  }

  return {variables, styles}
}
const serializeVariables = memoize([{}, WeakMap], serializeVariables_)

const mergeVariables_ = (target, source) => {
  target = Object.assign({}, target)
  const keys = Object.keys(source)

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i],
      value = source[key]
    if (typeof value === 'object' && value !== null)
      target[key] = mergeVariables_(target[key] || {}, value)
    else target[key] = value
  }

  return target
}
const mergeVariables = memoize([WeakMap, WeakMap], mergeVariables_)

function unique() {
  const set = {},
    out = []

  for (let i = 0; i < arguments.length; i++) {
    for (let j = 0; j < arguments[i].length; j++) {
      const value = arguments[i][j]
      if (set[value] === 1) continue
      set[value] = 1
      out.push(value)
    }
  }

  return out
}

const minifyRe = [
  /\s{2,}|\n|\t/g,
  /([:;,([{}>~/])\s+/g,
  /\s+([;,)\]{}>~/!])/g,
  /(\/\*)\s+/,
  /\s+(\*\/)/,
]

const normalizeStyles_ = (styles, variables) => {
  if (typeof styles === 'function') {
    return normalizeStyles_(styles(variables), variables)
  } else if (typeof styles === 'object') {
    styles = styleObjectToString(styles)
  }

  return !styles
    ? ''
    : styles
        .replace(minifyRe[0], ' ')
        .replace(minifyRe[1], '$1')
        .replace(minifyRe[2], '$1')
        .replace(minifyRe[3], '$1')
        .replace(minifyRe[4], '$1')
        .trim()
}

export const normalizeStyles = memoize([Map, WeakMap], normalizeStyles_)

const normalizeStyleDefs = (dash, styleDefs, styleName) => {
  if (typeof styleName === 'string') {
    return normalizeStyles(styleDefs[styleName], dash.variables)
  } else if (typeof styleName === 'object') {
    let keys = Object.keys(styleName),
      nextStyles = ''

    for (let i = 0; i < keys.length; i++) {
      if (styleName[keys[i]]) {
        nextStyles += normalizeStyles(styleDefs[keys[i]], dash.variables)
      }
    }

    return normalizeStyles(nextStyles, dash.variables)
  }
}

const normalizeArgs = (dash, styleDefs, args) => {
  if (args.length > 1) {
    const argDefs = {}

    for (let i = 0; i < args.length; i++) {
      const arg = args[i]
      if (typeof arg === 'string') argDefs[arg] = true
      else if (typeof arg === 'object') Object.assign(argDefs, arg)
    }

    return normalizeStyleDefs(dash, styleDefs, argDefs)
  } else return normalizeStyleDefs(dash, styleDefs, args[0])
}

//
// Where the magic happens
const createStyles = dash => {
  let addLabels
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

  function styles() {
    let defs = arguments[0]
    if (arguments.length > 1) {
      defs = Object.assign(
        {},
        ...Array.prototype.slice
          .call(arguments)
          .map(arg => (typeof arg === 'function' ? arg.styles : arg))
      )
    }

    //
    // style()
    function style() {
      let normalizedStyles = normalizeArgs(dash, defs, arguments)
      if (!normalizedStyles) return ''
      let name = dash.hash(normalizedStyles)
      // explicit here on purpose so it's not in every test
      if (process.env.NODE_ENV === 'development') {
        name = addLabels(name, arguments)
      }
      const className = `${dash.key}-${name}`
      dash.insert(`.${className}`, name, normalizedStyles, dash.sheet)
      return className
    }

    style.css = function() {
      return normalizeArgs(dash, defs, arguments)
    }
    style.dash = dash
    style.styles = defs
    return style
  }

  //
  // Methods
  styles.create = options => createStyles(createDash(options))

  styles.extract = (clear = true) => {
    if (__DEV__) {
      if (IS_BROWSER)
        throw new Error('styles.extract() only works in node environments')
    }

    const cachedStyles = unique(
      dash.variablesCache,
      dash.globalCache,
      Object.keys(dash.insertCache)
    )
    let output = ''
    for (let i = 0; i < cachedStyles.length; i++)
      output += dash.stylisCache[cachedStyles[i]]
    if (clear) dash.clear()
    return output
  }

  styles.extractTags = (clear = true) => {
    if (__DEV__) {
      if (IS_BROWSER)
        throw new Error('styles.extractTags() only works in node environments')
    }

    const nonceString = dash.sheet.nonce ? ` nonce="${dash.sheet.nonce}"` : ''
    let output = ''
    const cachedStyles = unique(
      dash.variablesCache,
      dash.globalCache,
      Object.keys(dash.insertCache)
    )
    // explicit check here for test envs
    if (process.env.NODE_ENV === 'development') {
      // uses separate tags in dev
      for (let i = 0; i < cachedStyles.length; i++) {
        const key = cachedStyles[i]
        output +=
          `<style data-${dash.key}="${key}"${nonceString}>` +
          dash.stylisCache[key] +
          `</style>`
      }
    } else {
      // uses one tag in prod
      const names = cachedStyles.join(' ')
      output =
        `<style data-${dash.key}="${names}"${nonceString}>` +
        styles.extract(false) +
        `</style>`
    }

    if (clear) dash.clear()
    return output
  }

  styles.variables = vars => {
    const serialized = serializeVariables(dash.key, vars)
    dash.variables = mergeVariables(dash.variables, serialized.variables)
    const name = `${dash.hash(serialized.styles)}-variables`
    if (dash.variablesCache.indexOf(name) === -1) dash.variablesCache.push(name)
    dash.insert(':root', name, serialized.styles, dash.sheet)
  }

  styles.themes = vars => {
    Object.assign(dash.themes, vars)
    styles.theme(dash.themes.default ? 'default' : Object.keys(dash.themes)[0])
  }

  styles.theme = theme => {
    const serialized = serializeVariables(dash.key, dash.themes[theme])
    dash.variables = mergeVariables(dash.variables, serialized.variables)
    const name = `${dash.hash(serialized.styles)}-variables`
    const className = `${dash.key}-${theme}-theme`
    dash.insert(`.${className}`, name, serialized.styles, dash.sheet)
    return className
  }

  styles.global = function() {
    let styles =
      typeof arguments[0] === 'function'
        ? arguments[0](dash.variables)
        : interpolate(arguments)
    styles = normalizeStyles(styles, dash.variables)
    if (!styles) return () => {}
    const name = `${dash.hash(styles)}-global`
    const sheet = styleSheet(dash.sheet)
    if (dash.globalCache.indexOf(name) === -1) dash.globalCache.push(name)
    dash.insert('', name, styles, sheet)

    return () => {
      delete dash.insertCache[name]
      if (dash.globalCache.indexOf(name) === -1) dash.globalCache.push(name)
      sheet.flush()
    }
  }

  styles.dash = dash
  return styles
}

//
// Creates default dash styles function
export const styles = createStyles(createDash())
export default styles
