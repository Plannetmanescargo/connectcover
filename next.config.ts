import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return { beforeFiles: [{ source: "/.well-known/apple-developer-merchantid-domain-association", destination: "/api/paypal/apple-domain" }] };
  },
  outputFileTracingIncludes: {
    "/api/paypal/apple-domain": ["./lib/paypal/domains/*.txt", "./public/.well-known/apple-developer-merchantid-domain-association"],
  },
};

export default nextConfig;
