import { createMDX } from "fumadocs-mdx/next";

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  output: "standalone",
  reactStrictMode: true,
  transpilePackages: ["shiki"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**",
      },
    ],
  },

  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          // 仅允许特定可信网站嵌入
          {
            key: 'Content-Security-Policy',
            value: "frame-ancestors 'self' https://crowdcomputed.cc https://crowdcomputed.com;"
          }
        ]
      }
    ];
  }

  async rewrites() {
    return [
      {
        source: "/docs/:path*.mdx",
        destination: "/llms.mdx/docs/:path*",
      },
    ];
  },
};

export default withMDX(config);
