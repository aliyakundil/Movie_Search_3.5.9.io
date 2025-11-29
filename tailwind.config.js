/** @type {import('tailwindcss').Config} */
const tailwindConfig = {
  darkMode: "class", // позволяет переключать темы через класс 'dark'
  content: [
    "./src/**/*.{js,ts,jsx,tsx}", // путь ко всем твоим компонентам
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default tailwindConfig;
