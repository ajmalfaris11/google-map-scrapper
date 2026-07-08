/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-outfit)', 'sans-serif'],
      },
      colors: {
        'bg-primary': 'var(--bg-primary)',
        'bg-secondary': 'var(--bg-secondary)',
        'bg-tertiary': 'var(--bg-tertiary)',
        'bg-frame': 'var(--bg-frame)',
        'bg-canvas': 'var(--bg-canvas)',
        'text-frame': 'var(--text-frame)',
        'card-hero-start': 'var(--card-hero-start)',
        'card-hero-end': 'var(--card-hero-end)',
        'card-hero-text': 'var(--card-hero-text)',
        'card-secondary-bg': 'var(--card-secondary-bg)',
        'card-secondary-text': 'var(--card-secondary-text)',
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-muted': 'var(--text-muted)',
        'accent-primary': 'var(--accent-primary)',
        'accent-hover': 'var(--accent-hover)',
        'accent-glow': 'var(--accent-glow)',
        'success': 'var(--success)',
        'warning': 'var(--warning)',
        'error': 'var(--error)',
        'border-color': 'var(--border-color)',
        'border-hover': 'var(--border-hover)',
        'glass-bg': 'var(--glass-bg)',
        'glass-border': 'var(--glass-border)',
      },
    },
  },
  plugins: [],
};
