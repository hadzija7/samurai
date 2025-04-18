import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */

  //added cause of the following issue: Failed to generate cache key for https://yellowstone-rpc.litprotocol.com
  experimental: {
    serverComponentsHmrCache: false, // defaults to true
  },
};

export default nextConfig;
