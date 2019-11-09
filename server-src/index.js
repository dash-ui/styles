import fs from 'fs'
import path from 'path'

export const writeStyles = async (styles, outputPath, options = {}) => {
  const {name, clearCache = true} = options
  const stylesString = styles.extract(clearCache)
  const filename = path.join(outputPath, `${name || styles.cache.hash(stylesString)}.css`)
  await fs.promises.writeFile(filename, stylesString)
  return {filename, styles: stylesString}
}
