import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const site = process.env.SITE_URL;

export default defineConfig({
  output: 'static',
  // GitHub Pages 部署到 <user>.github.io/<repo>/ 时，CI 里通过 BASE_PATH 注入（如 /game-relife/）
  base: process.env.BASE_PATH || '/',
  // 有 SITE_URL 时才设置，避免本地构建出现 site 未配置警告
  ...(site ? { site } : {}),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
