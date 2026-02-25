import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  {
    // Disable new React 19 strict rules that didn't exist in eslint-config-next@15
    // to keep lint behavior same as before migration
    rules: {
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/immutability": "off",
      "react-hooks/incompatible-library": "off",
    },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
