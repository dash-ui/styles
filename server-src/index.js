import fs from 'fs'
import path from 'path'
import hash from '@emotion/hash'

export const writeStyles = async (styles, outputPath, options = {}) => {
  const {name, clearCache = true} = options
  const stylesString = styles.extract(clearCache)
  const filename = path.join(outputPath, `${name || hash(stylesString)}.css`)
  await fs.promises.writeFile(filename, stylesString)
  return {filename, styles: stylesString}
}
