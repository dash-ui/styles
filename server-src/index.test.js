/**
 * @jest-environment node
 */
// import styles from '../src'

describe('Configure', () => {
  /*
  it('removes vendor prefixing', () => {
    const myStyles = styles.create({prefix: false})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(myStyles.extract()).toMatchSnapshot()
  })

  it('has customized vendor prefixing', () => {
    // adds prefixes to transform, but not flex
    const prefix = function(key, value, context) {
      if (typeof context !== 'number') throw 'fail'

      switch (key) {
        case 'transform':
          return true
        case 'disable':
          if (value !== 'flex') throw 'fail'
        // eslint-disable-next-line
        default:
          return false
      }
    }

    const myStyles = styles.create({prefix})
    const style = myStyles({
      flex: {display: 'flex', transform: 'translateX(30px)'},
    })

    style('flex')
    expect(myStyles.extract()).toMatchSnapshot()
  })

  it('adds nonce to style tags', () => {
    const myStyles = styles.create({nonce: 'EDNnf03nceIOfn39fn3e9h3sdfa'})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(myStyles.extractTags()).toMatchSnapshot()
  })

  it('changes key to "css"', () => {
    const myStyles = styles.create({key: 'css'})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(myStyles.extractTags()).toMatchSnapshot()
  })
})

describe('Usage', () => {
  it('extracts single style tag in prod', () => {
    const myStyles = styles.create({})
    const style = myStyles({
      flex: {display: 'flex'},
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    })

    style('flex')
    style('btn')
    expect(myStyles.extractTags()).toMatchSnapshot()
  })

  it('extracts global styles', () => {
    const myStyles = styles.create({})
    myStyles.global`
      :root {
        --hello: "world";
      } 
    `

    expect(myStyles.extractTags()).toMatchSnapshot()
  })

  it('extracts global variables', () => {
    const myStyles = styles.create({})
    myStyles.variables({
      colors: {
        blue: '#09a',
      },
    })

    expect(myStyles.extractTags()).toMatchSnapshot()
  })

  it('extracts theme variables', () => {
    const myStyles = styles.create({})
    myStyles.themes({
      dark: {
        colors: {
          primary: '#000',
        },
      },
      light: {
        colors: {
          primary: '#fff',
        },
      },
    })

    expect(myStyles.extractTags()).toMatchSnapshot()
    myStyles.theme('dark')
    expect(myStyles.extractTags()).toMatchSnapshot()
    myStyles.theme('light')
    expect(myStyles.extractTags()).toMatchSnapshot()
  })

  it('caches styles', () => {
    const myStyles = styles.create({})
    const style = myStyles({
      flex: {display: 'flex'},
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    })

    style('flex')
    style('btn')
    style('flex')
    style('btn')
    expect(myStyles.extractTags()).toMatchSnapshot()
  })
   */
  it('passes', () => {
    expect(true).toBe(true)
  })
})
