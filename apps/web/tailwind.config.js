import { createRequire } from "module";
const require = createRequire(import.meta.url);

/** @type {import('tailwindcss').Config} */
export default {
  presets: [require("../../packages/config/tailwind.preset.js")],
  content: ["./src/**/*.{html,js,svelte,ts}"],
  theme: { extend: {} },
  plugins: []
};
