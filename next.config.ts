import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pg", "pg-boss", "bcryptjs"],
  experimental: {
    // Загрузка договоров идёт через Server Actions, лимит по умолчанию — 1 МБ.
    serverActions: { bodySizeLimit: "26mb" },
  },
};

export default nextConfig;
