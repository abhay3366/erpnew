/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      "encrypted-tbn0.gstatic.com",
      "www.john15.rocks",
      "res.cloudinary.com"
    ],
  },

  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },

  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

module.exports = nextConfig;
