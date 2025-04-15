import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  base: '/ttrpg-character-sheet/',
  plugins: [solid(), tailwindcss()],
})
