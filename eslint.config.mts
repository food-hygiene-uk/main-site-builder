import { defineConfig } from "eslint/config";
import css from "@eslint/css";
import cssicorn from "eslint-cssicorn";
import jsdocPlugin from "eslint-plugin-jsdoc";
import markdown from "@eslint/markdown";
import prettierConfig from "eslint-config-prettier";
import promisePlugin from "eslint-plugin-promise";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import unicornPlugin from "eslint-plugin-unicorn";

/**
Exports the ESLint configuration using the `defineConfig` helper.
This configuration includes rules and plugins for TypeScript, JavaScript, and Prettier.
*/
export default defineConfig([
  // tsPlugin.configs.recommended needs to be spread or included as an object
  {
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
    },
  },

  // Plugin configurations
  promisePlugin.configs["flat/recommended"],

  {
    // Global settings for all files
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        Deno: "readonly",
        globalThis: "readonly",
        // Add other Deno/browser globals if needed
        console: "readonly",
        fetch: "readonly",
        setTimeout: "readonly",
        setInterval: "readonly",
        clearTimeout: "readonly",
        clearInterval: "readonly",
        // Browser specific globals (if client-side code uses them)
        document: "readonly",
        navigator: "readonly",
        location: "readonly",
        customElements: "readonly",
        HTMLElement: "readonly",
        Event: "readonly",
        CustomEvent: "readonly",
      },
    },
    rules: {
      // General rules
      "no-unused-vars": "off", // Use @typescript-eslint/no-unused-vars instead
    },
  },
  {
    files: ["**/*.js", "**/*.mjs", "**/*.mts"],
    extends: ["jsdoc/flat/recommended-mixed", "unicorn/recommended"],
    plugins: {
      jsdoc: jsdocPlugin,
      unicorn: unicornPlugin,
    },
    rules: {
      "jsdoc/check-alignment": "off", // Use unicorn/no-asterisk-prefix-in-documentation-comments
      "jsdoc/tag-lines": ["error", "never", { startLines: 1 }], // Ensure space after description
      "unicorn/no-typeof-undefined": ["error", { checkGlobalVariables: true }],
      "unicorn/filename-case": ["error", { case: "kebabCase" }],
      "unicorn/no-null": "off", // Allow null
    },
  },
  {
    // TypeScript specific settings (.mts files)
    files: ["**/*.mts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        project: null, // Deno doesn't use tsconfig.json in the same way
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
    },
    rules: {
      // ...tsPlugin.configs["eslint-recommended"].rules, // This might need adjustment
      ...tsPlugin.configs.recommended.rules, // Already included above
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_" },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-inferrable-types": "warn",
      "@typescript-eslint/no-non-null-assertion": "off", // Allow non-null assertions
    },
  },
  {
    // JavaScript Modules
    files: ["**/*.mjs"],
    languageOptions: {
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
  },
  {
    // JavaScript script files
    files: ["**/*.js"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      "unicorn/prefer-module": "off", // Allow "use strict" in .js files
    },
  },
  {
    files: ["**/schema.mts", "**/types.mts", "**/*.test.mts"],
    rules: {
      "unicorn/max-nested-calls": ["error", { max: 6 }],
    },
  },
  {
    files: ["**/*.md"],
    plugins: {
      markdown,
    },
    language: "markdown/commonmark",
    processor: "markdown/markdown",
    extends: ["markdown/recommended"],
  },
  cssicorn.configs.recommended,
  {
    files: ["**/*.css"],
    plugins: {
      css,
      cssicorn,
    },
    extends: ["css/recommended"],
    language: "css/css",
    rules: {
      "css/use-baseline": [
        "error",
        {
          allowFunctions: ["light-dark"],
          allowProperties: ["accent-color", "user-select"],
        },
      ], // handled by postcss
    },
  },
  {
    // Ignore patterns
    ignores: [
      ".agents/",
      "agents/",
      "dist/",
      "build/",
      "deno.lock",
      "package.json",
      "deno.json",
      "assets/google*.html",
      "node_modules/",
      ".vscode/",
    ],
  },

  // Prettier config must be last to override other formatting rules
  prettierConfig,
]);
