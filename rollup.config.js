import resolve from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript'
import json from '@rollup/plugin-json'
// import cjs from '@rollup/plugin-commonjs'
import { terser } from 'rollup-plugin-terser';

// use '--environment minify' with rollup
// to minify the input
// const minify = process.env.minify || false;

// use "--environment bundle" with rollup
// if you want to make a bundle.
// const bundle = process.env.bundle || false;

export default {
  input: 'src/crypto-embeds.ts',
  output: { file: 'crypto-embeds.js',format: 'esm' },
  plugins:
    [
      typescript(),
      resolve(),
      // cjs(),
      json(),
      terser()
      // minify ? terser() : {},
    ]
};