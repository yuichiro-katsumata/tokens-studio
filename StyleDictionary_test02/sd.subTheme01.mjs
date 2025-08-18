import StyleDictionary from "style-dictionary";
import { register } from "@tokens-studio/sd-transforms";
register(StyleDictionary);

// Primitives を出力から除外するフィルタ（★ v5は filter プロパティ）
StyleDictionary.registerFilter({
  name: "exclude-primitives",
  filter: (token) => !/[/\\]Primitives[/\\]/.test(token.filePath || "")
});

export default {
  source: [
    "tokens/Primitives/subTheme01.json",  // 参照解決のため読み込む
    "tokens/Semantics/subTheme01.json",
    "tokens/Components/subTheme01.json"
  ],
  preprocessors: ["tokens-studio"],
  platforms: {
    css: {
      transformGroup: "tokens-studio",
      buildPath: "dist/css/",
      files: [{
        destination: "tokens.subTheme01.css",
        format: "css/variables",
        options: { selector: '[data-theme="subTheme01"]', outputReferences: false },
        filter: "exclude-primitives"       // ★ 名前で指定
      }]
    }
  },
  log: { verbosity: "verbose" }
};
