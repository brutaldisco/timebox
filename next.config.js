const withPWA = require("next-pwa")({
  dest: "public",
  disable:
    process.env.NODE_ENV === "development" || process.env.DESKTOP_EXPORT === "1",
});

/** @type {import("next").NextConfig} */
const isDesktopExport = process.env.DESKTOP_EXPORT === "1";

const nextConfig = {
  reactStrictMode: true,
  ...(isDesktopExport
    ? {
        output: "export",
        images: {
          unoptimized: true,
        },
      }
    : {}),
};

module.exports = withPWA(nextConfig);
