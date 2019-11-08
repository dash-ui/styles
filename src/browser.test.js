import styles from './index'

const serializeRules = (selector = `style[data-dash]`) => {
  const els = document.querySelectorAll(selector)
  return els[0].sheet.cssRules
    .map(({selectorText, style: {// eslint-disable-next-line
        ends, starts, _importants, __starts, parentRule, parentStyleSheet, ...other}}) => [ // eslint-disable-next-line // eslint-disable-next-line // eslint-disable-next-line // eslint-disable-next-line // eslint-disable-next-line
      selectorText,
      other,
    ])
    .reduce((p, c) => {
      p[c[0]] = c[1]
      return p
    }, {})
}

afterEach(() => {
  styles.sheet.flush()
  document.getElementsByTagName('html')[0].innerHTML = ''
})

describe('Configure', () => {
  it('turns off vendor prefixing', () => {
    const myStyles = styles.configure({prefix: false})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot('DOM')
    }
  })

  it('adds nonce to style tags', () => {
    const myStyles = styles.configure({nonce: 'EDNnf03nceIOfn39fn3e9h3sdfa'})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot('DOM')
    }
  })

  it('changes key to "css"', () => {
    const myStyles = styles.configure({key: 'css'})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')

    for (let element of document.querySelectorAll(`style[data-dash]`)) {
      expect(element).toMatchSnapshot('DOM')
    }
  })

  it('turns on speedy', () => {
    const myStyles = styles.configure({speedy: true})
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
    const myStyles = styles.configure({speedy: true})
    const style = myStyles({
      flex: {display: 'flex'},
      block: {display: 'block'},
    })

    style('flex')
    style('block')
    expect(serializeRules()).toMatchSnapshot()
  })
})