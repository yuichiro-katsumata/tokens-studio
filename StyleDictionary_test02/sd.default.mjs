// sd.default.mjs
import StyleDictionary from "style-dictionary";
import { register } from "@tokens-studio/sd-transforms";
register(StyleDictionary);

// Primitives を出力から除外（参照には使う）
StyleDictionary.registerFilter({
  name: "exclude-primitives",
  filter: (token) => !/[/\\]Primitives[/\\]/.test(token.filePath || "")
});

export default {
  source: [
    "tokens/Primitives/default.json",   // 参照解決用に読み込み
    "tokens/Semantics/default.json",
    "tokens/Components/default.json"
  ],
  preprocessors: ["tokens-studio"],
  platforms: {
    css: {
      transformGroup: "tokens-studio",
      buildPath: "dist/css/",
      files: [{
        destination: "tokens.default.css",
        format: "css/variables",
        options: { selector: ":root", outputReferences: false }, // 参照を最終値に解決
        filter: "exclude-primitives"
      }]
    }
  },
  log: { verbosity: "verbose" }
};
