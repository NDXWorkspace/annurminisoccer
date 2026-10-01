import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Fetch-on-mount dengan seed-first render adalah arsitektur yang disengaja:
      // halaman terisi dari seed lokal, lalu fetch menimpa di continuation async
      // setelah await (bukan cascade render sinkron). Aturan ini tidak bisa
      // membedakan keduanya, jadi diturunkan ke warning agar pola data-fetching
      // standar tidak diblokir. Jangan tambah fetch sinkron baru di effect.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
