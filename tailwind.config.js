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
          400: "#B694FF",
          500: "#9C6BFF", // main accent
          600: "#824EF2",
          700: "#653BCC",
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
