// next.config.js
const withPWA = require("next-pwa");

const runtimeCaching = [
  {
    urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/,
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "images-cache",
      expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
    },
  },
  {
    urlPattern: /^https:\/\/fonts\.(?:gstatic|googleapis)\.com\/.*/i,
    handler: "CacheFirst",
    options: {
      cacheName: "google-fonts",
      expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
    },
  },
  {
    urlPattern: /\.(?:js|css|woff2?|ttf|otf)$/,
    handler: "StaleWhileRevalidate",
    options: {
      cacheName: "static-resources",
      expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
    },
  },
  {
    urlPattern: /^https:\/\/.*\/api\/.*$/i,
    handler: "NetworkFirst",
    options: {
      cacheName: "api-cache",
      networkTimeoutSeconds: 10,
      expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
    },
  },
];

const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: {},
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

module.exports = withPWA(
  {
    dest: "public",
    register: true,
    skipWaiting: true,
    disable: false,
    // only needed if you see build-manifest precache errors:
    buildExcludes: [/app-build-manifest\.json$/],
    // runtime caching rules:
    runtimeCaching,
    // fallback for offline navigations:
    fallbacks: {
      document: "/offline.html",
    },
  }
)(nextConfig);
