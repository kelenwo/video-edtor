/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'editor-dark': '#1a1a1a',
        'editor-darker': '#0f0f0f',
        'editor-gray': '#2a2a2a',
        'editor-light-gray': '#3a3a3a',
        'editor-blue': '#3b82f6',
        'editor-green': '#10b981',
        'editor-purple': '#8b5cf6',
        'editor-orange': '#f59e0b',
        'editor-red': '#ef4444',
      },
      fontFamily: {
        'sans': ['Poppins', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

