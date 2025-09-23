/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
    "./node_modules/flowbite-react/**/*.{js,jsx}",
    "./node_modules/flowbite/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        sidebar: "#0F1A1C",
        brand: {
          500: "#2bcb6b",
          600: "#1fb058"
        }
      },
      boxShadow: {
        card: "0 2px 8px rgba(0,0,0,0.06)"
      },
      borderRadius: {
        "2xl": "1rem"
      },
      screens: {
        lg992: "992px", // 👈 custom breakpoint
      },
    }
  },
  plugins: [require('flowbite/plugin')]
}
