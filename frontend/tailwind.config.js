/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                premium: {
                    blue: {
                        50: '#eef2ff',
                        100: '#e0e7ff',
                        500: '#6366f1', // Indigo-ish for highlights
                        800: '#1e1b4b', // Deep Navigation Blue
                        900: '#0f172a', // Darkest Background
                    },
                    gold: {
                        400: '#fbbf24',
                        500: '#f59e0b',
                        600: '#d97706', // Metallic Gold Accent
                    }
                },
                slate: {
                    50: '#f8fafc', // Light Background
                }
            },
            fontFamily: {
                sans: ['Inter', 'sans-serif'],
            }
        },
    },
    plugins: [],
}
