import crc from 'crc'
import styles from './index'

const serializeRules = (selector = `style[data-dash]`) => {
  const els = document.querySelectorAll(selector)
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

afterEach(() => {
  styles.dash.sheet.flush()
  document.getElementsByTagName('html')[0].innerHTML = ''
})

describe('Configure', () => {
  it('turns off vendor prefixing', () => {
    const myStyles = styles.create({prefix: false})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot('DOM')
    }
  })

  it('configures hash algorithm', () => {
    const customHash = string => crc.crc32(string).toString(16)
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

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot('DOM')
    }
  })

  it('changes key to "css"', () => {
    const myStyles = styles.create({key: 'css'})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot('DOM')
    }
  })

  it('changes container to document.body', () => {
    const myStyles = styles.create({container: document.body})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')

    for (let element of document.querySelectorAll(`body style[data-dash]`)) {
      expect(element).toMatchSnapshot('')
    }
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
})

describe('Usage', () => {
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
    let tag = document.createElement('style')
    tag.setAttribute(`data-dash`, '1ut9bc3')
    tag.appendChild(
      document.createTextNode(
        `.dash-_1ut9bc3{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;}`
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
    let tag = document.createElement('style')
    tag.setAttribute(`data-dash`, '1ut9bc3')
    tag.appendChild(
      document.createTextNode(
        `.dash-_1ut9bc3{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;}`
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
  })

  it('creates global variables', () => {
    styles.create().variables({
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

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot(':root')
    }
  })

  it('creates global variables w/ scales', () => {
    styles.create().variables({
      spacing: ['1rem', '2rem', '4rem'],
    })

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot(':root')
    }
  })

  it('creates theme variables', () => {
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

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot(':root')
    }
  })

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

  it('ignores unknown keys', () => {
    const style = styles.create()({
      flex: {display: 'flex'},
    })

    let name = style('noop')
    expect(typeof name).toBe('string')
    expect(name.length).toBe(0)

    name = style({noop: true})
    expect(typeof name).toBe('string')
    expect(name.length).toBe(0)
  })

  it('allows unitless object values', () => {
    const style = styles.create()({
      box: {width: 200, height: '200px'},
    })

    style('box')

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot('200x200')
    }
  })

  it('adds styles by order of definition when called', () => {
    const style = styles.create({prefix: false})({
      inline: 'display: inline;',
      flex: {display: 'flex'},
      block: {display: 'block'},
    })

    style('flex', 'block', 'inline')

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot('flex, block, inline')
    }

    styles.dash.clear()
    styles.dash.sheet.flush()
    style({flex: true, block: true, inline: true})

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot('flex, block, inline')
    }
  })

  it('allows comments', () => {
    const style = styles.create()({
      flex: `
        /* this is a flex style */
        display: flex;
      `,
    })

    expect(style('flex')).toMatchSnapshot()
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
      box: vars => expect(vars).toMatchSnapshot(),
    })

    style('box')
    expect(myStyles.theme('dark')).toMatchSnapshot()
    style('box')
    expect(myStyles.theme('light')).toMatchSnapshot()
    style('box')
  })

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

  it('injects global styles', () => {
    const styles_ = styles.create()
    styles_.global(`
      html {
        font-size: 100%;
      }
    `)

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot()
    }
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

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot()
    }
  })

  it('unmounts global styles w/ callback', () => {
    const styles_ = styles.create()
    const unmount = styles_.global(`
      html {
        font-size: 100%;
      }
    `)

    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(1)
    expect(document.querySelectorAll(`style[data-dash]`)[0]).toMatchSnapshot()
    unmount()
    expect(document.querySelectorAll(`style[data-dash]`).length).toBe(0)
  })

  it('adds dev labels', () => {
    let prevEnv = process.env.NODE_ENV
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
    let prevEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    const style = styles.create()({
      'box=big': {width: 400, height: '400px'},
    })

    style('box=big')

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot('400x400')
    }

    process.env.NODE_ENV = prevEnv
  })

  it('allows multiple arguments', () => {
    const style = styles.create()(
      {
        flex: `display: flex;`,
        block: `display: block;`,
      },
      {
        inline: `display: inline;`,
      }
    )

    style('flex', 'block', 'inline')

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot()
    }
  })

  it('allows style functions in arguments', () => {
    const myStyles = styles.create()
    const styleA = myStyles({
      flex: `display: flex;`,
      block: `display: block;`,
    })
    const styleB = myStyles(
      {
        inline: `display: inline;`,
      },
      styleA
    )

    styleB('flex', 'block', 'inline')

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot()
    }
  })
})

describe('Exceptions', () => {
  it('throws error for extract methods', () => {
    const style = styles.create()({
      flex: {display: 'flex'},
    })

    expect(() => {
      style.extract()
    }).toThrowErrorMatchingSnapshot()

    expect(() => {
      style.extractTags()
    }).toThrowErrorMatchingSnapshot()
  })

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
