import path from 'path'
global.document = {}

export const rollup = (config) => {
  config.output[0].exports = 'named'
  return config
}
