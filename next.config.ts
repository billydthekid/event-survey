import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  // เด้ง "/" → "/login" ก่อนเข้าขั้น render (ไม่งั้น redirect() ในหน้าแรก
  // จะชนกับการ validate static shell ของ partialPrefetching → error "instant")
  async redirects() {
    return [{ source: "/", destination: "/login", permanent: false }];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
