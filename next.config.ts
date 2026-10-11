import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // 사진은 브라우저에서 압축해 보내지만(Uploader), 압축에 실패한 원본을 위한 여유분.
    // Vercel 함수 요청 본문 한도(4.5MB)보다 작게 유지할 것.
    serverActions: { bodySizeLimit: "4mb" },
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
