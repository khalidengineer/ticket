const isProd = process.env.NODE_ENV === 'production';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: isProd ? '/ticket' : '',
  images: {
    unoptimized: true,
  },
  allowedDevOrigins: ['192.168.1.21', 'localhost'],
};

export default nextConfig;
