import styles from './index'

afterEach(() => {
  document.getElementsByTagName('html')[0].innerHTML = ''
})

describe('Usage', () => {
  it('returns single class name', () => {
    const style = styles.configure()({
      flex: {display: 'flex'},
      block: {display: 'block'},
      inline: 'display: inline;',
    })

    expect(style('flex')).toMatchSnapshot()
    expect(style('flex', 'block', 'inline')).toMatchSnapshot()
    expect(style({flex: true, block: false, inline: true})).toMatchSnapshot()
  })

  it('returns empty string when falsy', () => {
    const style = styles.configure()({
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
    const style = styles.configure()({
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
    const style = styles.configure()({
      box: {width: 200, height: '200px'},
    })

    style('box')

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot('200x200')
    }
  })

  it('adds styles by order of definition when called', () => {
    const style = styles.configure({prefix: false})({
      inline: 'display: inline;',
      flex: {display: 'flex'},
      block: {display: 'block'},
    })

    style('flex', 'block', 'inline')

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot('flex, block, inline')
    }

    styles.cache.clear()
    styles.sheet.flush()
    style({flex: true, block: true, inline: true})

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot('flex, block, inline')
    }
  })

  it('supports internally nested styles w/ functions', () => {
    const style = styles.configure({prefix: false})({
      blue: style => `
        color: blue;
        ${style('red')} {
          color: purple;
        }
      `,
      red: 'color: red;',
    })

    style('blue')

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot(style('red'))
    }
  })

  it('allows multiple arguments in styles()', () => {
    const style = styles.configure({prefix: false})(
      {
        blue: style => `
        color: blue;
        ${style('red')} {
          color: purple;
        }
      `,
      },
      {
        red: 'color: red;',
      }
    )

    expect(style('blue')).toMatchSnapshot()
    expect(style('red')).toMatchSnapshot()
  })

  it('allows comments', () => {
    const style = styles.configure()({
      flex: `
        /* this is a flex style */
        display: flex;
      `,
    })

    expect(style('flex')).toMatchSnapshot()
  })

  it('adds dev labels', () => {
    let prevEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    const style = styles.configure()({
      flex: `display: flex;`,
      block: `display: block`,
      inline: `display: inline;`,
    })

    expect(style('flex')).toMatchSnapshot('-flex')
    expect(style('flex', 'inline')).toMatchSnapshot('-flex-inline')
    expect(style('flex', {inline: false, block: true})).toMatchSnapshot(
      '-flex-block'
    )
    process.env.NODE_ENV = prevEnv
  })
})

describe('Exceptions', () => {
  it('throws error for extract methods', () => {
    const style = styles.configure()({
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
    const style = styles.configure()({
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
