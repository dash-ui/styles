import fs from 'fs'
import path from 'path'

export const writeStyles = async (styles, outputPath, options = {}) => {
  const {name, hash = styles.dash.hash, clearCache = true} = options
  const stylesString = styles.extract(clearCache)
  const filename = path.join(outputPath, `${name || hash(stylesString)}.css`)
  await fs.promises.writeFile(filename, stylesString)
  return {filename, styles: stylesString}
}
