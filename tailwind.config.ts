import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        card: {
          DEFAULT: "var(--card)",
          foreground: "var(--card-foreground)",
        },
        popover: {
          DEFAULT: "var(--popover)",
          foreground: "var(--popover-foreground)",
        },
        primary: {
          DEFAULT: "var(--primary)",
          foreground: "var(--primary-foreground)",
        },
        secondary: {
          DEFAULT: "var(--secondary)",
          foreground: "var(--secondary-foreground)",
        },
        muted: {
          DEFAULT: "var(--muted)",
          foreground: "var(--muted-foreground)",
        },
        accent: {
          DEFAULT: "var(--accent)",
          foreground: "var(--accent-foreground)",
        },
        destructive: {
          DEFAULT: "var(--destructive)",
          foreground: "var(--destructive-foreground)",
        },
        border: "var(--border)",
        input: "var(--input)",
        ring: "var(--ring)",
        chart: {
          "1": "var(--chart-1)",
          "2": "var(--chart-2)",
          "3": "var(--chart-3)",
          "4": "var(--chart-4)",
          "5": "var(--chart-5)",
        },
        sidebar: {
          DEFAULT: "var(--sidebar)",
          foreground: "var(--sidebar-foreground)",
          primary: "var(--sidebar-primary)",
          "primary-foreground": "var(--sidebar-primary-foreground)",
          accent: "var(--sidebar-accent)",
          "accent-foreground": "var(--sidebar-accent-foreground)",
          border: "var(--sidebar-border)",
          ring: "var(--sidebar-ring)",
        },
        // RingToneRiches specific colors
        ringtone: {
          gold: "#f1c40f",
          "gold-dark": "#e67e22",
          "dark-bg": "#0f0f0f",
          "card-bg": "#1a1a1a",
          "border-dark": "#333333",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "Menlo", "monospace"],
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
        scroll: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        pulse: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in-right": {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        "bounce-in": {
          "0%": { transform: "scale(0.3)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "70%": { transform: "scale(0.9)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        scroll: "scroll 30s linear infinite",
        "spin-slow": "spin 3s ease-out",
        "pulse-slow": "pulse 3s ease-in-out infinite",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in-right": "slide-in-right 0.3s ease-out",
        "bounce-in": "bounce-in 0.6s ease-out",
      },
      backdropFilter: {
        none: "none",
        blur: "blur(20px)",
      },
      boxShadow: {
        "wolf": "0 10px 40px rgba(241, 196, 15, 0.2)",
        "wolf-lg": "0 20px 60px rgba(241, 196, 15, 0.3)",
        "competition": "0 8px 32px rgba(0, 0, 0, 0.4)",
        "competition-hover": "0 20px 60px rgba(0, 0, 0, 0.6)",
      },
      spacing: {
        "18": "4.5rem",
        "88": "22rem",
        "128": "32rem",
      },
      screens: {
        "xs": "475px",
        "3xl": "1600px",
      },
      zIndex: {
        "60": "60",
        "70": "70",
        "80": "80",
        "90": "90",
        "100": "100",
      },
      maxWidth: {
        "8xl": "88rem",
        "9xl": "96rem",
      },
      transitionProperty: {
        "height": "height",
        "spacing": "margin, padding",
      },
      transitionDuration: {
        "400": "400ms",
        "600": "600ms",
        "800": "800ms",
        "1200": "1200ms",
      },
      transitionTimingFunction: {
        "bounce-in": "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "wolf-gradient": "linear-gradient(135deg, #f1c40f 0%, #e67e22 100%)",
        "card-gradient": "linear-gradient(135deg, rgba(241, 196, 15, 0.1) 0%, rgba(26, 26, 26, 1) 100%)",
      },
      aspectRatio: {
        "4/3": "4 / 3",
        "3/2": "3 / 2",
        "5/4": "5 / 4",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"), 
    require("@tailwindcss/typography"),
    // Custom plugin for Wolf Competitions specific utilities
    function({ addUtilities }: { addUtilities: any }) {
      const newUtilities = {
        '.text-wolf-gradient': {
          background: 'linear-gradient(135deg, #f1c40f 0%, #e67e22 100%)',
          '-webkit-background-clip': 'text',
          '-webkit-text-fill-color': 'transparent',
          'background-clip': 'text',
        },
        '.bg-wolf-card': {
          background: 'linear-gradient(135deg, rgba(241, 196, 15, 0.05) 0%, rgba(26, 26, 26, 1) 100%)',
        },
        '.wolf-shadow': {
          'box-shadow': '0 10px 40px rgba(241, 196, 15, 0.2)',
        },
        '.wolf-shadow-lg': {
          'box-shadow': '0 20px 60px rgba(241, 196, 15, 0.3)',
        },
        '.competition-hover': {
          'transition': 'transform 0.2s ease, box-shadow 0.2s ease',
          '&:hover': {
            'transform': 'translateY(-4px)',
            'box-shadow': '0 20px 40px rgba(0, 0, 0, 0.4)',
          },
        },
        '.modal-backdrop': {
          'backdrop-filter': 'blur(8px)',
          'background': 'rgba(0, 0, 0, 0.5)',
        },
        '.glass-effect': {
          'backdrop-filter': 'blur(10px)',
          'background': 'rgba(26, 26, 26, 0.8)',
          'border': '1px solid rgba(241, 196, 15, 0.2)',
        },
        '.scrollbar-wolf': {
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: 'hsl(0 0% 15%)',
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'hsl(0 0% 63%)',
            'border-radius': '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            background: 'hsl(48 96% 53%)',
          },
        },
      }
      addUtilities(newUtilities)
    }
  ],
} satisfies Config;
