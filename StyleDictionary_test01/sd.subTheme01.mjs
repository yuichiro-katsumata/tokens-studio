// sd.subTheme01.mjs
import StyleDictionary from 'style-dictionary';
import { register } from '@tokens-studio/sd-transforms';
register(StyleDictionary);

export default {
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
};
