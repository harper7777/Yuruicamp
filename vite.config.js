import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const projectRoot = dirname(fileURLToPath(import.meta.url));

/**
 * Defines every static HTML page plus the SCSS entry that Vite should process.
 */
export default defineConfig({
  appType: 'mpa',
  css: {
    devSourcemap: true,
  },
  build: {
    assetsInlineLimit: 4096,
    rollupOptions: {
      input: {
        index: resolve(projectRoot, 'index.html'),
        home: resolve(projectRoot, 'pages/home.html'),
        products: resolve(projectRoot, 'pages/products.html'),
        productDetail: resolve(projectRoot, 'pages/product-detail.html'),
        checkout: resolve(projectRoot, 'pages/checkout.html'),
        checkoutSuccess: resolve(projectRoot, 'pages/checkout-success.html'),
        memberCenter: resolve(projectRoot, 'pages/member-center.html'),
        blog: resolve(projectRoot, 'pages/blog.html'),
        blogDetail: resolve(projectRoot, 'pages/blog-detail.html'),
        branches: resolve(projectRoot, 'pages/branches.html'),
        faq: resolve(projectRoot, 'pages/faq.html'),
        styles: resolve(projectRoot, 'src/styles.js'),
      },
    },
  },
});
