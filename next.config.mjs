import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Removed output: 'standalone' for Vercel deployment
  // Set explicit workspace root to avoid multiple lockfile warning
  outputFileTracingRoot: __dirname,
  // Improved asset handling
  images: {
    domains: [
      'images.clerk.dev',
      'api.dicebear.com',
      'res.cloudinary.com'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.dicebear.com',
        port: '',
        pathname: '/7.x/**',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
        port: '',
        pathname: '/**',
      }
    ],
    unoptimized: true
  },
  // Strict mode for better error catching
  reactStrictMode: true,
  // Add redirects
  async redirects() {
    return [
      {
        source: '/task',
        destination: '/tugas',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
