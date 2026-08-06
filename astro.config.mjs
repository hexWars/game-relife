import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// 部署到 GitHub Pages 时自动推导 base 与 site：
//   GITHUB_REPOSITORY 形如 "owner/repo"（GitHub Actions 自动注入），
//   → site = https://<owner>.github.io
//   → base = /<repo>/
// 本地开发没有该变量，base 默认 '/'，无需任何额外配置。
const repo = process.env.GITHUB_REPOSITORY || '';
const site =
  process.env.SITE_URL || (repo ? `https://${repo.split('/')[0]}.github.io` : undefined);

export default defineConfig({
  output: 'static',
  base: process.env.BASE_PATH || (repo ? `/${repo.split('/')[1]}/` : '/'),
  ...(site ? { site } : {}),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
  },
});
