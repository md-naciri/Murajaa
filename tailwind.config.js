/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,jsx,ts,tsx}",
    "./src/components/**/*.{js,jsx,ts,tsx}",
    "./src/features/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          light: '#f0c96b',
          DEFAULT: '#d4a843',
          dim: '#8a6a20',
        },
        surface: {
          1: '#161b22',
          2: '#21262d',
        }
      }
    },
  },
  plugins: [],
}
