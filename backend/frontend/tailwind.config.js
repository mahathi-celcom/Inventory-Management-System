/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        'celcom': {
          'primary': '#E2007A',    // Gradient Magenta
          'secondary': '#F7941D',  // Gradient Orange  
          'accent': '#6C2DC7',     // Purple
          'text': '#2C005B',       // Deep Purple/Navy
          'hover': '#52006A',      // Dark Purple
          'success': '#3BB54A',    // Success Green
          'background': '#F4F4F4', // Light Gray
        },
        'gradient': {
          'from': '#E2007A',       // Magenta
          'to': '#F7941D',         // Orange
        }
      },
      backgroundImage: {
        'celcom-gradient': 'linear-gradient(135deg, #E2007A 0%, #F7941D 100%)',
        'celcom-gradient-hover': 'linear-gradient(135deg, #52006A 0%, #E2007A 100%)',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
} 