/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',      // static export -> ./out  (used by Capacitor and Vercel)
  trailingSlash: true,   // /app/ -> app/index.html (works inside the APK)
  images: { unoptimized: true },
};
module.exports = nextConfig;
