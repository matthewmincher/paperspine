import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";

export default [
  {
    files: ["packages/*/src/**/*.{ts,tsx}"],
    plugins: { "@typescript-eslint": tseslint },
    languageOptions: {
      parser: tsparser,
      parserOptions: { project: true },
    },
    rules: {
      ...tseslint.configs.recommended.rules,
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_" },
      ],
    },
  },
];
