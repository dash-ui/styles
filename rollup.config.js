import babel from 'rollup-plugin-babel'
import replace from 'rollup-plugin-replace'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import {terser} from 'rollup-plugin-terser'
import pkg from './package.json'

process.env.BABEL_ENV = 'umd'
const config = (filename, env, plugins = []) => ({
  input: 'src/index.js',
  output: {
    file: filename,
    format: 'umd',
    name: 'DashUI',
  },
  plugins: [
    resolve(),
    commonjs(),
    babel(),
    replace({
      'process.env.NODE_ENV': JSON.stringify(env),
    }),
    ...plugins,
  ],
})

export default [
  // browser-friendly UMD build
  config(pkg.unpkg, 'production', [
    terser({
      output: {comments: false},
      compress: {
        booleans_as_integers: true,
        hoist_funs: true,
        keep_fargs: false,
        passes: 2,
        unsafe_comps: true,
        unsafe_math: true,
        unsafe_undefined: true,
      },
    }),
  ]),
  config(pkg.unpkg.replace('.min', ''), 'development'),
]
