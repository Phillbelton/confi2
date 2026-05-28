import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "tests/report/**",
    "test-results/**",
  ]),
  {
    rules: {
      // Convención TS estándar: prefijo "_" señala "intencionalmente sin uso"
      // (ej. al destructurar para excluir un campo: const { x: _x, ...rest }).
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
          destructuredArrayIgnorePattern: "^_",
        },
      ],
      // Solo flagear chars que generan ambigüedad real en JSX (`<` y `>`
      // como tags). Comillas y apóstrofes son válidas y comunes en texto
      // en español; escapearlas innecesariamente perjudica legibilidad.
      "react/no-unescaped-entities": ["error", { forbid: [">", "<"] }],
    },
  },
]);

export default eslintConfig;
