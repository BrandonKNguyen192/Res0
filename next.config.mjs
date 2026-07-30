/** @type {import('next').NextConfig} */
export default {
  // Menu photographs arrive as data URLs in the request body.
  experimental: { serverActions: { bodySizeLimit: '8mb' } },
};
