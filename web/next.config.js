// next.config.js
// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  devIndicators: false,
  // https://nextjs.org/docs/pages/api-reference/config/next-config-js/output
  // this is not working, will need to set it up for faster builds
  // output: 'standalone',
  webpack(config) {
    // ensure we have a resolve section
    config.resolve = config.resolve || {};
    // stub out these modules everywhere
    config.resolve.fallback = {
      ...(config.resolve.fallback || {}),
      fs: false,
      path: false,
      canvas: false,
    };
    return config;
  },
  transpilePackages: [
    "@rever/tailwind-config",
    "@rever/common",
    "@rever/constants",
    "@rever/services",
    "@rever/stores",
    "@rever/types",
    "@rever/utils",
    "@rever/validations",
  ],
};

module.exports = nextConfig;
