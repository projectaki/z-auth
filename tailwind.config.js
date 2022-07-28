/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './apps/sample-auth/src/**/*.{html,ts}',
    './apps/utils/src/**/*.{html,ts}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
};
