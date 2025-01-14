import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Vous pouvez ajouter vos couleurs personnalisées ici
      },
      fontFamily: {
        // Vous pouvez ajouter vos polices personnalisées ici
      },
    },
  },
  plugins: [],
}
export default config
