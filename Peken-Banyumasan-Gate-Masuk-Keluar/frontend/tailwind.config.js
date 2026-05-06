/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans:    ['"Montserrat"', 'system-ui', 'sans-serif'],
                display: ['"Clash Display"', 'system-ui', 'sans-serif'],
                mono:    ['"Montserrat"', 'monospace'],
            },
            colors: {
                // ── Sage (replaces old green scale) ──────────────────────
                // All existing green-* classes automatically pick up sage tones.
                green: {
                    50:  '#f2f4e8',   // dash-bg (very pale sage) — page background
                    100: '#eef0e0',   // dash-accent-bg — badge/pill backgrounds
                    200: '#e4e7d4',   // dash-border — card & divider borders
                    300: '#c8d09a',   // dash-accent-border
                    400: '#a8b07a',   // sage-mid — hover on light bg
                    500: '#C3CA96',   // sage — primary brand accent
                    600: '#7a8a52',   // sage-dark — buttons, links on white
                    700: '#7a8a52',   // alias for backward compat
                    800: '#4f5c30',   // sage-deeper — hover state, headings
                    900: '#3a4428',   // very deep sage
                    950: '#1e2410',   // near-black sage
                },
                // ── Ink/Charcoal (sidebar, dark elements) ────────────────
                ink: {
                    DEFAULT: '#0D0D0D',
                    charcoal: '#1B1B1B',
                    carbon:   '#111111',
                },
                // ── Dashboard semantic surfaces ───────────────────────────
                sage: {
                    DEFAULT: '#C3CA96',
                    light:   '#dde3c0',
                    pale:    '#f2f4e8',
                    mid:     '#a8b07a',
                    dark:    '#7a8a52',
                    deeper:  '#4f5c30',
                },
                // ── Status colors (muted, harmonised with sage) ───────────
                success: {
                    DEFAULT: '#7A9B6A',
                    bg:      '#eef4eb',
                    border:  '#b8d4b0',
                },
                error: {
                    DEFAULT: '#B87272',
                    bg:      '#f7eeee',
                    border:  '#dbb8b8',
                },
                warning: {
                    DEFAULT: '#C4A24D',
                    bg:      '#f7f2e4',
                    border:  '#dcc882',
                },
                info: {
                    DEFAULT: '#6B8FA3',
                    bg:      '#eaf0f4',
                    border:  '#b0c8d8',
                },
                exit: {
                    DEFAULT: '#7A80B0',
                    bg:      '#eeeef8',
                    border:  '#b8badc',
                },
            },
            borderRadius: {
                'xl':  '12px',  // dash card default
                '2xl': '16px',  // dash large card
                '3xl': '20px',  // pill/button
            },
            boxShadow: {
                'sage-sm': '0 1px 3px rgba(30,32,16,.06), 0 1px 2px rgba(30,32,16,.04)',
                'sage-md': '0 4px 12px rgba(30,32,16,.08), 0 2px 4px rgba(30,32,16,.04)',
                'sage-lg': '0 8px 24px rgba(30,32,16,.10), 0 4px 8px rgba(30,32,16,.06)',
                'sage-accent': '0 4px 14px rgba(122,138,82,.25)',
            },
            transitionTimingFunction: {
                'ease-out-brand': 'cubic-bezier(0.22, 0.61, 0.36, 1)',
            },
            animation: {
                'pulse-live': 'pulse 1.5s cubic-bezier(0.4,0,0.6,1) infinite',
                'flash-value': 'flashValue 0.75s ease-out',
                'fade-in-up': 'fadeInUp 0.32s cubic-bezier(0.22,0.61,0.36,1) both',
            },
            keyframes: {
                flashValue: {
                    '0%':   { backgroundColor: '#eef4eb' },
                    '100%': { backgroundColor: 'transparent' },
                },
                fadeInUp: {
                    '0%':   { opacity: 0, transform: 'translateY(4px)' },
                    '100%': { opacity: 1, transform: 'translateY(0)' },
                },
            },
        },
    },
    plugins: [],
};
