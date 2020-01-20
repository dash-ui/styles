import crc from 'crc'
import styles from './index'

afterEach(() => {
  styles.dash.sheet.flush()
  document.getElementsByTagName('html')[0].innerHTML = ''
})

const serializeRules = (selector = `style[data-dash]`): any[] => {
  const els = document.querySelectorAll(selector)
  // @ts-ignore
  return els[0].sheet.cssRules
    .map(({selectorText, style: {// eslint-disable-next-line
        ends, starts, _importants, __starts, parentRule, parentStyleSheet, ...other}}) => [
      selectorText,
      other,
    ])
    .reduce((p, c) => {
      p[c[0]] = c[1]
      return p
    }, {})
}

describe('styles.create()', () => {
  it('turns off vendor prefixing', () => {
    const myStyles = styles.create({prefix: false})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot(
      'DOM'
    )
  })

  it('configures hash algorithm', () => {
    const customHash = (string: string): string =>
      crc.crc32(string).toString(16)
    const myStyles = styles.create({hash: customHash})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    expect(style('flex')).toMatchSnapshot()

    const style2 = styles.create()({
      flex: {display: 'flex'},
    })

    expect(style2('flex')).not.toBe(style('flex'))
  })

  it('adds nonce to style tags', () => {
    const myStyles = styles.create({nonce: 'EDNnf03nceIOfn39fn3e9h3sdfa'})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot(
      'DOM'
    )
  })

  it('changes key to "css"', () => {
    const myStyles = styles.create({key: 'css'})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot(
      'DOM'
    )
  })

  it('changes container to document.body', () => {
    const myStyles = styles.create({container: document.body})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(document.querySelectorAll(`body style[data-dash]`).length).toBe(1)
    expect(
      document.querySelectorAll(`body style[data-dash]`)[0]
    ).toMatchSnapshot()
  })

  it('turns on speedy', () => {
    const myStyles = styles.create({speedy: true})
    const style = myStyles({
      flex: {display: 'flex'},
      block: {display: 'block'},
    })

    style('flex')
    style('block')
    expect(serializeRules()).toMatchSnapshot()
  })

  it('should initialize w/ variables', () => {
    const myStyles = styles.create({variables: {box: {small: 100}}})
    const style = myStyles({
      small: ({box}) => ({
        width: box.small,
        height: box.small,
      }),
    })

    expect(style.css('small')).toMatchSnapshot()
  })

  it('should initialize w/ themes', () => {
    const myStyles = styles.create({
      themes: {
        light: {
          color: {
            primary: 'white',
          },
        },
        dark: {
          color: {
            primary: 'black',
          },
        },
      },
    })

    const style = myStyles({
      primary: ({color}) => ({color: color.primary}),
    })

    expect(style.css('primary')).toEqual('color:var(--color-primary);')
    expect(myStyles.theme('light')).toEqual('-ui-light-theme')
  })
})

describe('styles()', () => {
  it('returns single class name', () => {
    const style = styles.create()({
      flex: {display: 'flex'},
      block: {display: 'block'},
      inline: 'display: inline;',
    })

    expect(style('flex')).toMatchSnapshot()
    expect(style('flex', 'block', 'inline')).toMatchSnapshot()
    expect(style({flex: true, block: false, inline: true})).toMatchSnapshot()
  })

  it('returns css styles', () => {
    const style = styles.create()({
      flex: {display: 'flex'},
      block: {display: 'block'},
      inline: 'display: inline;',
    })

    expect(style.css('flex')).toMatchSnapshot()
    expect(style.css('flex', 'block', 'inline')).toMatchSnapshot()
    expect(
      style.css({flex: true, block: false, inline: true})
    ).toMatchSnapshot()
  })

  it('returns empty string when falsy', () => {
    const style = styles.create()({
      flex: {display: 'flex'},
    })

    let name = style(false)
    expect(typeof name).toBe('string')
    expect(name.length).toBe(0)

    name = style(false, null, undefined, 0, {flex: false})
    expect(typeof name).toBe('string')
    expect(name.length).toBe(0)
  })

  it(`shouldn't do anything with unprocessable object values`, () => {
    const style = styles.create()({
      // @ts-ignore
      flex: {display: 'flex', meaningless: null},
    })

    style('flex')
    expect(style.css('flex')).toMatchSnapshot()
  })

  it('ignores unknown keys', () => {
    const style = styles.create()({
      flex: {display: 'flex'},
    })
    // @ts-ignore
    let name = style('noop')
    expect(typeof name).toBe('string')
    expect(name.length).toBe(0)
    // @ts-ignore
    name = style({noop: true})
    expect(typeof name).toBe('string')
    expect(name.length).toBe(0)
  })
  it('allows unitless object values', () => {
    const style = styles.create()({
      box: {width: 200, height: '200px'},
    })

    style('box')
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot(
      '200x200'
    )
  })

  it('adds styles by order of definition when called', () => {
    const style = styles.create({prefix: false})({
      inline: 'display: inline;',
      flex: {display: 'flex'},
      block: {display: 'block'},
    })

    style('flex', 'block', 'inline')

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot(
      'flex, block, inline'
    )

    styles.dash.clear()
    styles.dash.sheet.flush()
    style({flex: true, block: true, inline: true})

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot(
      'flex, block, inline'
    )
  })

  it('allows comments', () => {
    const style = styles.create()({
      flex: `
        /* this is a flex style */
        display: flex;
      `,
    })

    expect(style.css('flex')).toMatchSnapshot()
  })

  it('allows full capabilities w/ style objects', () => {
    const style = styles.create()({
      flex: {
        display: 'flex',
        '&.foo': {
          display: 'block',
        },
      },
    })

    style('flex')
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot()
    expect(document.querySelectorAll(`style[data-dash]`)[1]).toMatchSnapshot()
  })

  it('passes variables to style callbacks', () => {
    const myStyles = styles.create()
    myStyles.variables({
      colors: {
        blue: '#09a',
        red: '#c12',
      },
    })

    myStyles.themes({
      dark: {
        colors: {
          bg: '#000',
          text: '#fff',
        },
      },
      light: {
        colors: {
          bg: '#fff',
          text: '#000',
          lightSpecific: '#ccc',
        },
      },
    })

    const style = myStyles({
      box: vars => {
        expect(vars).toMatchSnapshot()
        return ''
      },
    })

    style('box')
    expect(myStyles.theme('dark')).toMatchSnapshot()
    style('box')
    expect(myStyles.theme('light')).toMatchSnapshot()
    style('box')
  })

  it('adds dev labels', () => {
    const prevEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    const style = styles.create()({
      flex: `display: flex;`,
      block: `display: block;`,
      inline: `display: inline;`,
    })

    expect(style('flex')).toMatchSnapshot('-flex')
    expect(style('flex', 'inline')).toMatchSnapshot('-flex-inline')
    expect(style('flex', {inline: false, block: true})).toMatchSnapshot(
      '-flex-block'
    )
    process.env.NODE_ENV = prevEnv
  })

  it('replaces disallowed characters in dev labels', () => {
    const prevEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    const style = styles.create()({
      'box=big': {width: 400, height: '400px'},
    })

    style('box=big')
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot(
      '400x400'
    )
    process.env.NODE_ENV = prevEnv
  })

  it('allows default styles', () => {
    const style = styles.create()({
      default: `display: flex;`,
      block: `display: block;`,
    })

    style()
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)).toMatchSnapshot()
  })

  it('has a default style that is always applied first', () => {
    const style = styles.create()({
      block: `display: block;`,
      default: `display: flex;`,
    })

    style('block')
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)).toMatchSnapshot()
  })

  it('only applies default style once', () => {
    const style = styles.create()({
      default: `display: flex;`,
    })

    style('default')
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)).toMatchSnapshot()
  })

  it('flushes sheet tags', () => {
    const myStyles = styles.create({})
    const style = myStyles({
      flex: {display: 'flex'},
      block: {display: 'block'},
    })

    style('flex')
    style('block')
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2)
    myStyles.dash.sheet.flush()
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(0)
  })

  it('rehydrates', () => {
    const tag = document.createElement('style')
    tag.setAttribute(`data-dash`, '1ut9bc3')
    tag.setAttribute('data-cache', '-ui')
    tag.appendChild(
      document.createTextNode(
        `.-ui-_1ut9bc3{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;}`
      )
    )
    document.head.appendChild(tag)

    const myStyles = styles.create({})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
  })

  it('rehydrates into custom container', () => {
    const tag = document.createElement('style')
    tag.setAttribute(`data-dash`, '1ut9bc3')
    tag.setAttribute('data-cache', '-ui')

    tag.appendChild(
      document.createTextNode(
        `.-ui-_1ut9bc3{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;}`
      )
    )
    document.head.appendChild(tag)

    const myStyles = styles.create({container: document.body})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(document.querySelectorAll(`head style[data-dash]`).length).toBe(0)
    expect(document.querySelectorAll(`body style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
  })
})

describe(`styles.variables()`, () => {
  it('creates variables', () => {
    styles.create().variables({
      columns: 12,
      colors: {
        blue: '#09a',
        red: '#c12',
        lightRed: '#c1a',
      },
      spacing: {
        xs: '1rem',
      },
      system: {
        p: {md: '1rem', xs: '0.25rem', sm: '0.5rem', lg: '2rem', xl: '4rem'},
      },
    })

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot(
      ':root'
    )
  })

  it('removes variables when eject is called', () => {
    const myStyles = styles.create()
    const eject = myStyles.variables({
      colors: {
        blue: '#09a',
        red: '#c12',
        lightRed: '#c1a',
      },
      spacing: {
        xs: '1rem',
      },
      system: {
        p: {md: '1rem', xs: '0.25rem', sm: '0.5rem', lg: '2rem', xl: '4rem'},
      },
    })

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)).toMatchSnapshot()
    expect(Object.keys(myStyles.dash.insertCache).length).toBe(1)
    expect(Object.keys(myStyles.dash.variablesCache).length).toBe(1)
    eject()
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(0)
    expect(Object.keys(myStyles.dash.insertCache).length).toBe(0)
    expect(Object.keys(myStyles.dash.variablesCache).length).toBe(0)
  })

  it('still exists in caches when used more than once', () => {
    const myStyles = styles.create()
    const ejectA = myStyles.variables({
      colors: {
        blue: '#09a',
        red: '#c12',
        lightRed: '#c1a',
      },
      spacing: {
        xs: '1rem',
      },
      system: {
        p: {md: '1rem', xs: '0.25rem', sm: '0.5rem', lg: '2rem', xl: '4rem'},
      },
    })
    const ejectB = myStyles.variables({
      colors: {
        blue: '#09a',
        red: '#c12',
        lightRed: '#c1a',
      },
      spacing: {
        xs: '1rem',
      },
      system: {
        p: {md: '1rem', xs: '0.25rem', sm: '0.5rem', lg: '2rem', xl: '4rem'},
      },
    })

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot()
    expect(Object.keys(myStyles.dash.insertCache).length).toBe(1)
    expect(Object.keys(myStyles.dash.variablesCache).length).toBe(1)
    ejectA()
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(Object.keys(myStyles.dash.insertCache).length).toBe(1)
    expect(Object.keys(myStyles.dash.variablesCache).length).toBe(1)
    ejectB()
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(0)
    expect(Object.keys(myStyles.dash.insertCache).length).toBe(0)
    expect(Object.keys(myStyles.dash.variablesCache).length).toBe(0)
  })

  it('creates variables w/ scales', () => {
    styles.create().variables({
      spacing: ['1rem', '2rem', '4rem'],
    })

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot(
      ':root'
    )
  })
})

describe(`styles.themes()`, () => {
  it('creates variables', () => {
    styles.create().themes({
      dark: {
        colors: {
          bg: '#000',
          text: '#fff',
        },
      },
      light: {
        colors: {
          bg: '#fff',
          text: '#000',
        },
      },
    })

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot(
      'dark'
    )
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot(
      'light'
    )
  })

  it('removes variables when eject is called', () => {
    const myStyles = styles.create()
    const eject = myStyles.themes({
      dark: {
        colors: {
          bg: '#000',
          text: '#fff',
        },
      },
      light: {
        colors: {
          bg: '#fff',
          text: '#000',
        },
      },
    })

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2)
    expect(document.querySelectorAll(`style[data-dash]`)).toMatchSnapshot()
    expect(Object.keys(myStyles.dash.insertCache).length).toBe(2)
    expect(Object.keys(myStyles.dash.variablesCache).length).toBe(2)
    eject()
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(0)
    expect(Object.keys(myStyles.dash.insertCache).length).toBe(0)
    expect(Object.keys(myStyles.dash.variablesCache).length).toBe(0)
  })
})

describe(`styles.global()`, () => {
  it('passes variables to global styles', () => {
    const myStyles = styles.create()
    myStyles.variables({
      colors: {
        blue: '#09a',
        red: '#c12',
      },
    })

    myStyles.themes({
      dark: {
        colors: {
          bg: '#000',
          text: '#fff',
        },
      },
      light: {
        colors: {
          bg: '#fff',
          text: '#000',
        },
      },
    })

    myStyles.global(vars => {
      expect(vars).toMatchSnapshot()
      return ''
    })
  })

  it('injects global style object', () => {
    const styles_ = styles.create()
    styles_.global({
      html: {
        color: 'blue',
        '.foo': {
          color: 'green',
        },
      },
    })

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot()
    expect(document.querySelectorAll(`style[data-dash]`)[1]).toMatchSnapshot()
  })

  it('should inject global styles once', () => {
    const {global} = styles.create()
    global(`
      :root {
        --spacing-0: 0;
      }
      
      html {
        font-size: 100%;
      }
    `)
    global`
      :root {
        --spacing-0: 0;
      }
      
      html {
        font-size: 100%;
      }
    `
    global`
      :root {
        --spacing-1: 0.5rem;
      }
    `

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(3)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot(
      ':root'
    )
    expect(document.querySelectorAll(`style[data-dash]`)[1]).toMatchSnapshot(
      'html'
    )
    expect(document.querySelectorAll(`style[data-dash]`)[2]).toMatchSnapshot(
      ':root'
    )
  })

  it('ejects global styles when callback is called', () => {
    const myStyles = styles.create()
    const eject = myStyles.global(`
      html {
        font-size: 100%;
      }
    `)

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot()
    expect(Object.keys(myStyles.dash.insertCache).length).toBe(1)
    expect(Object.keys(myStyles.dash.globalCache).length).toBe(1)
    eject()
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(0)
    expect(Object.keys(myStyles.dash.insertCache).length).toBe(0)
    expect(Object.keys(myStyles.dash.globalCache).length).toBe(0)
  })

  it('still exists in caches when a global is used more than once but ejected once', () => {
    const myStyles = styles.create()
    const ejectA = myStyles.global(`
      html {
        font-size: 100%;
      }
    `)
    const ejectB = myStyles.global(`
      html {
        font-size: 100%;
      }
    `)

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot()
    expect(Object.keys(myStyles.dash.insertCache).length).toBe(1)
    expect(Object.keys(myStyles.dash.globalCache).length).toBe(1)
    ejectA()
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(Object.keys(myStyles.dash.insertCache).length).toBe(1)
    expect(Object.keys(myStyles.dash.globalCache).length).toBe(1)
    ejectB()
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(0)
    expect(Object.keys(myStyles.dash.insertCache).length).toBe(0)
    expect(Object.keys(myStyles.dash.globalCache).length).toBe(0)
  })

  it('allows @font-face', () => {
    const {global} = styles.create()
    global`
      @font-face {
        font-family: "Open Sans";
        src: url("/fonts/OpenSans-Regular-webfont.woff2") format("woff2"),
             url("/fonts/OpenSans-Regular-webfont.woff") format("woff");
      }
    `

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot()
  })

  it('allows @import', () => {
    const {global} = styles.create()
    global`
      @import url("navigation.css");
    `

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot()
  })

  it('allows style object', () => {
    const {global} = styles.create()
    global({
      ':root': {
        '--foo': 'bar',
      },
    })

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot()
  })
})

describe('styles.one()', () => {
  it('creates style w/ template literal', () => {
    const myStyles = styles.create()
    const myCls = myStyles.one`
      display: flex;
    `

    myCls()
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot()
  })

  it('creates style w/ object', () => {
    const myStyles = styles.create()
    const myCls = myStyles.one({
      display: 'block',
      span: {
        display: 'flex',
      },
    })

    myCls()
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(2)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot()
    expect(document.querySelectorAll(`style[data-dash]`)[1]).toMatchSnapshot()
  })

  it(`won't create style def if falsy`, () => {
    const myStyles = styles.create()
    const myCls = myStyles.one`
      display: flex;
    `

    myCls()
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot()
  })

  it(`won't create style if function call is provided falsy value`, () => {
    const myStyles = styles.create()
    const myCls = myStyles.one`
      display: flex;
    `

    myCls(false)
    myCls(null)
    myCls(0)
    myCls('')

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(0)
  })

  it(`returns a class name when toString() is called`, () => {
    const myStyles = styles.create()
    const myCls = myStyles.one`
      display: flex;
    `

    String(myCls)
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot()
  })

  it(`returns css when css() is called`, () => {
    const myStyles = styles.create()
    const myCls = myStyles.one`
      display: flex;
    `

    expect(myCls.css()).toMatchSnapshot()
  })

  it(`returns css when css.toString() is called`, () => {
    const myStyles = styles.create()
    const myCls = myStyles.one`
      display: flex;
    `

    expect(`${myCls.css}`).toMatchSnapshot()
  })

  it(`can be called as a function w/ string value`, () => {
    const myStyles = styles.create()
    const myCls = myStyles.one('display: flex;')
    expect(myCls()).toMatchSnapshot()
  })

  it(`can be called as a function w/ function value`, () => {
    type Variables = {
      color: {
        blue: 'blue'
      }
    }
    const myStyles = styles.create<Variables, 'dark' | 'light'>()
    myStyles.variables({color: {blue: 'blue'}})
    const myCls = myStyles.one(({color}) => `color: ${color.blue};`)
    expect(myCls.css()).toMatchSnapshot()
  })
})

describe('Exceptions', () => {
  it('throws for unterminated comments', () => {
    const style = styles.create()({
      flex: `
        /* this is a flex style with an unterminated comment ;)
        display: flex;
      `,
    })

    expect(() => {
      style('flex')
    }).toThrowErrorMatchingSnapshot()
  })
})
