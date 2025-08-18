// sd.config.mjs
import StyleDictionary from "style-dictionary";
import { register } from "@tokens-studio/sd-transforms"; // ← API名は register
register(StyleDictionary);

const cssPlatform = (selector, dest) => ({
  transformGroup: "tokens-studio",
  buildPath: "dist/css/",
  files: [
    {
      destination: dest,
      format: "css/variables",
      options: { selector, outputReferences: true },
    },
  ],
});

export default [
  // default テーマ
  {
    source: [
      "tokens/Primitives/default.json",
      "tokens/Semantics/default.json",
      "tokens/Components/default.json",
    ],
    preprocessors: ["tokens-studio"],
    platforms: { css: cssPlatform(":root", "tokens.default.css") },
    log: { verbosity: "verbose" },
  },
  // subTheme01 テーマ
  {
    source: [
      "tokens/Primitives/subTheme01.json",
      "tokens/Semantics/subTheme01.json",
      "tokens/Components/subTheme01.json",
    ],
    preprocessors: ["tokens-studio"],
    platforms: {
      css: cssPlatform('[data-theme="subTheme01"]', "tokens.subTheme01.css"),
    },
    log: { verbosity: "verbose" },
  },
];
