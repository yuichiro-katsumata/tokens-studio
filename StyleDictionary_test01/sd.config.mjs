// sd.config.mjs
import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';

register(StyleDictionary);

export default [
  {
    preprocessors: ['tokens-studio'],
    source: ['.tmp/default.json'],
    platforms: {
      css: {
        transformGroup: 'tokens-studio',
        buildPath: 'dist/css/',
        files: [{
          destination: 'tokens.default.css',
          format: 'css/variables',
          options: { selector: ':root', outputReferences: false }
        }]
      }
    }
  },
  {
    preprocessors: ['tokens-studio'],
    source: ['.tmp/subTheme01.json'],
    platforms: {
      css: {
        transformGroup: 'tokens-studio',
        buildPath: 'dist/css/',
        files: [{
          destination: 'tokens.subTheme01.css',
          format: 'css/variables',
          options: { selector: '[data-theme="subTheme01"]', outputReferences: false }
        }]
      }
    }
  }
];
