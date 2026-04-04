import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import vitest from "eslint-plugin-vitest";

export default tseslint.config(
  { ignores: ["dist/**", "node_modules/**"] },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
  {
    files: ["**/*.{test,spec}.{ts,tsx}"],
    ...vitest.configs.recommended,
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    files: ["scripts/**/*.mjs"],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
);
