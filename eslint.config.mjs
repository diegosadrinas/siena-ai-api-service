import globals from "globals";
import pluginJs from "@eslint/js";
import tseslint from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import prettier from "eslint-config-prettier";

export default [
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    ignores: ["dist", "cdk.out", "*.js", "frontend/webpage/.open-next", "frontend/webpage/.next"],
    languageOptions: {
      globals: globals.browser,
      parser: tsParser,
    },
    plugins: {
      "@typescript-eslint": tseslint,
    },
    rules: {
      "no-console": "warn",
      "eqeqeq": "error",
      "no-duplicate-imports": "error",
      "@typescript-eslint/no-empty-interface": ["warn", { "allowSingleExtends": true }],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  },
  pluginJs.configs.recommended,
  tseslint.configs["eslint-recommended"],
  tseslint.configs.recommended,
  prettier,
];