import multi from '@rollup/plugin-multi-entry';
import typescript from '@rollup/plugin-typescript';

export default {
  input: ['src/commands/**/*.ts'],
  output: {
    dir: 'dist/commands',
    format: 'es'

  },
  plugins: [multi(), typescript()]
};