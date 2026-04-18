const path = require('path')
const dir = path.resolve(__dirname)

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    path.join(dir, 'app/**/*.{js,ts,jsx,tsx}'),
    path.join(dir, 'components/**/*.{js,ts,jsx,tsx}'),
  ],
  theme: { extend: {} },
  plugins: [],
}
