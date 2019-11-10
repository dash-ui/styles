import fs from 'fs'
import path from 'path'

export const writeStyles = async (styles, outputPath, options = {}) => {
  let {name, hash = styles.dash.hash, clearCache = true} = options
  const stylesString = styles.extract(clearCache)
  name = `${name || hash(stylesString)}.css`
  const filename = path.join(outputPath, name)
  await fs.promises.writeFile(filename, stylesString)
  return {filename, name, path: outputPath, styles: stylesString}
}
