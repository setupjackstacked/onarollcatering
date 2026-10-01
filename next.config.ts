import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // All photography is the business's own, served from public/images — no
    // remote hosts, so nothing here can break because someone else's CDN did.
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
