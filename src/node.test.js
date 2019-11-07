/**
 * @jest-environment node
 */
import styles from './index'

describe('Configure', () => {
  it('removes vendor prefixing', () => {
    const myStyles = styles.configure({prefix: false})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(myStyles.extract()).toMatchSnapshot()
  })

  it('adds nonce to style tags', () => {
    const myStyles = styles.configure({nonce: 'EDNnf03nceIOfn39fn3e9h3sdfa'})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(myStyles.extractTags()).toMatchSnapshot()
  })

  it('changes key to "css"', () => {
    const myStyles = styles.configure({key: 'css'})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(myStyles.extractTags()).toMatchSnapshot()
  })
})

describe('Usage', () => {
  it('extracts style tags', () => {
    const myStyles = styles.configure({})
    const style = myStyles({
      flex: {display: 'flex'},
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `
    })

    style('flex')
    style('btn')
    expect(myStyles.extractTags()).toMatchSnapshot()
  })

  it('caches styles', () => {
    const myStyles = styles.configure({})
    const style = myStyles({
      flex: {display: 'flex'},
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `
    })

    style('flex')
    style('btn')
    style('flex')
    style('btn')
    expect(myStyles.extractTags()).toMatchSnapshot()
  })
})

