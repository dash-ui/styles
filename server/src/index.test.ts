/**
 * @jest-environment node
 */
import * as fs from 'fs'
import styles from '../../src'
import {
  createStyleTagFromString,
  createStyleTagFromCache,
  writeStylesFromCache,
  writeStylesFromString,
} from './index'

describe('Configure', () => {
  it('removes vendor prefixing', () => {
    const myStyles = styles.create({prefix: false})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot()
  })

  it('has customized vendor prefixing', () => {
    // adds prefixes to transform, but not flex
    const prefix = function (key, value, context): boolean {
      if (typeof context !== 'number') throw 'fail'

      switch (key) {
        case 'transform':
          return true
        // @ts-ignore
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
    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot()
  })

  it('changes key to "css"', () => {
    const myStyles = styles.create({key: 'css'})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot()
  })
})

describe('createStyleTagFromCache', () => {
  it('adds nonce to style tags', () => {
    const myStyles = styles.create({nonce: 'EDNnf03nceIOfn39fn3e9h3sdfa'})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot()
  })

  it('extracts global styles', () => {
    const myStyles = styles.create({})
    myStyles.global`
      :root {
        --hello: "world";
      } 
    `

    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot()
  })

  it('extracts global variables', () => {
    const myStyles = styles.create({})
    myStyles.variables({
      colors: {
        blue: '#09a',
      },
    })

    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot()
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

    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot()
    myStyles.theme('dark')
    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot()
    myStyles.theme('light')
    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot()
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
    expect(createStyleTagFromCache(myStyles)).toMatchSnapshot()
  })
})

describe('createStyleTagFromString', () => {
  it('adds nonce to style tags', () => {
    const myStyles = styles.create({nonce: 'EDNnf03nceIOfn39fn3e9h3sdfa'})
    const style = myStyles({
      flex: {display: 'flex'},
    })

    style('flex')
    expect(
      createStyleTagFromString(`<div className=${style('flex')}>`, myStyles)
    ).toMatchSnapshot()
  })

  it('extracts global styles', () => {
    const myStyles = styles.create({})
    myStyles.global`
      :root {
        --hello: "world";
      }
    `

    expect(createStyleTagFromString('', myStyles)).toMatchSnapshot()
  })

  it('extracts global variables', () => {
    const myStyles = styles.create({})
    myStyles.variables({
      colors: {
        blue: '#09a',
      },
    })

    expect(createStyleTagFromString('', myStyles)).toMatchSnapshot()
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
    expect(
      createStyleTagFromString(
        `
      <div class=${style('flex')}>
        <div class=${style('btn')}>
          Hello
        </div>
      </div>
    `,
        myStyles
      )
    ).toMatchSnapshot()
  })
})

describe('writeStylesFromString', () => {
  it('writes', async () => {
    const myStyles = styles.create({})
    const style = myStyles({
      flex: {display: 'flex'},
      btn: `
        border-radius: 1000px;
        background: blue;
        color: white;
      `,
    })

    const finfo = await writeStylesFromString(
      `
        <div class=${style('flex')}>
          <div class=${style('btn')}>
            Hello
          </div>
        </div>
      `,
      './',
      myStyles
    )
    expect(fs.existsSync(finfo.filename)).toBe(true)
    fs.unlinkSync(finfo.filename)
    expect(finfo).toMatchSnapshot()
  })

  it('writes custom name', async () => {
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

    const finfo = await writeStylesFromString(
      `
        <div class=${style('flex')}>
          <div class=${style('btn')}>
            Hello
          </div>
        </div>
      `,
      './',
      myStyles,
      {name: 'foo.css'}
    )
    expect(fs.existsSync(finfo.filename)).toBe(true)
    fs.unlinkSync(finfo.filename)
    expect(finfo).toMatchSnapshot()
  })

  it('writes custom key', async () => {
    const myStyles = styles.create({key: 'css'})
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

    const finfo = await writeStylesFromString(
      `
        <div class=${style('flex')}>
          <div class=${style('btn')}>
            Hello
          </div>
        </div>
      `,
      './',
      myStyles
    )
    expect(fs.existsSync(finfo.filename)).toBe(true)
    fs.unlinkSync(finfo.filename)
    expect(finfo).toMatchSnapshot()
  })

  it('writes custom hash', async () => {
    const myStyles = styles.create({hash: () => 'f8bCooDawg'})
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

    const finfo = await writeStylesFromString(
      `
        <div class=${style('flex')}>
          <div class=${style('btn')}>
            Hello
          </div>
        </div>
      `,
      './',
      myStyles
    )
    expect(fs.existsSync(finfo.filename)).toBe(true)
    fs.unlinkSync(finfo.filename)
    expect(finfo).toMatchSnapshot()
  })
})

describe('writeStylesFromCache', () => {
  it('writes', async () => {
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

    const finfo = await writeStylesFromCache('./', myStyles)
    expect(fs.existsSync(finfo.filename)).toBe(true)
    fs.unlinkSync(finfo.filename)
    expect(finfo).toMatchSnapshot()
  })

  it('writes custom name', async () => {
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

    const finfo = await writeStylesFromCache('./', myStyles, {name: 'foo.css'})
    expect(fs.existsSync(finfo.filename)).toBe(true)
    fs.unlinkSync(finfo.filename)
    expect(finfo).toMatchSnapshot()
  })

  it('writes custom key', async () => {
    const myStyles = styles.create({key: 'css'})
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

    const finfo = await writeStylesFromCache('./', myStyles)
    expect(fs.existsSync(finfo.filename)).toBe(true)
    fs.unlinkSync(finfo.filename)
    expect(finfo).toMatchSnapshot()
  })

  it('writes custom hash', async () => {
    const myStyles = styles.create({hash: () => 'f8bCooDawg'})
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

    const finfo = await writeStylesFromCache('./', myStyles)
    expect(fs.existsSync(finfo.filename)).toBe(true)
    fs.unlinkSync(finfo.filename)
    expect(finfo).toMatchSnapshot()
  })
})
