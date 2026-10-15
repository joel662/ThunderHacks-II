/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--bg)',
        card: 'var(--bg-card)',
        accent: 'var(--accent)',
        secondary: 'var(--secondary)',
        surface: 'var(--bg-surface)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        muted: 'var(--text-muted)',
        themed: 'var(--text)',
        border: 'var(--border)',
      },
      borderColor: {
        DEFAULT: 'var(--border)',
      },
      textColor: {
        themed: 'var(--text)',
        comment: 'var(--comment-text)',
      },
      backgroundColor: {
        hover: 'var(--hover-bg)',
      },
      boxShadow: {
        themed: 'var(--shadow)',
      },
    },
  },
  plugins: [],
};
