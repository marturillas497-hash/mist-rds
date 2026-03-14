/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.resolve.extensions.push(".wasm");

    config.externals = [...(config.externals || [])];

    if (isServer) {
      config.externals.push("onnxruntime-node");
    }

    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    return config;
  },

  serverExternalPackages: ["@xenova/transformers", "onnxruntime-node"],
};

export default nextConfig;