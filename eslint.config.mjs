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
    "tools/**",
  ]),
  // The ported Framer modules read refs in render on a clock tick, and Nav mirrors the pre-paint theme after mount.
  { files: ["src/modules/**", "src/components/Nav.tsx"], rules: { "react-hooks/refs": "off", "react-hooks/set-state-in-effect": "off" } },
]);

export default eslintConfig;
