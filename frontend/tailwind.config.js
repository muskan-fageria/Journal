/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "error-container": "#93000a",
        "surface-container-low": "#1b1c1c",
        "secondary-fixed-dim": "#e6c183",
        "on-primary-fixed": "#131e16",
        "surface": "var(--surface)",
        "background": "var(--bg)",
        "surface-variant": "var(--surface2)",
        "surface-container-high": "var(--surface2)",
        "surface-container": "var(--surface)",
        "surface-container-low": "var(--surface3)",
        "surface-container-lowest": "var(--surface3)",
        "surface-container-highest": "var(--surface2)",
        "surface-bright": "var(--surface)",
        "surface-dim": "var(--surface2)",
        "outline": "var(--border)",
        "outline-variant": "var(--border)",
        "on-surface": "var(--text)",
        "on-surface-variant": "var(--text-dim)",
        "on-background": "var(--text)",
      },
      borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "full": "9999px" },
      spacing: { "gutter": "24px", "margin-page": "40px", "unit": "8px", "section-gap": "80px" },
      fontFamily: {
        "body-md": ["Inter", "sans-serif"],
        "body-lg": ["Inter", "sans-serif"],
        "h3": ["Cormorant Garamond", "serif"],
        "label-caps": ["Inter", "sans-serif"],
        "h1": ["Cormorant Garamond", "serif"],
        "h2": ["Cormorant Garamond", "serif"],
        "newsreader": ["Cormorant Garamond", "serif"],
        "sans": ["Inter", "sans-serif"],
        "serif": ["Cormorant Garamond", "serif"]
      },
      fontSize: {
        "body-md": ["16px", { lineHeight: "1.7", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "1.8", fontWeight: "400" }],
        "h3": ["32px", { lineHeight: "1.4", fontWeight: "500" }],
        "label-caps": ["12px", { lineHeight: "1.2", letterSpacing: "0.15em", fontWeight: "500" }],
        "h1": ["64px", { lineHeight: "1.1", letterSpacing: "-0.01em", fontWeight: "500" }],
        "h2": ["44px", { lineHeight: "1.2", fontWeight: "500" }]
      }
    },
  },
  plugins: [],
}
