/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Transformers.js needs to resolve .wasm files correctly
    config.resolve.extensions.push(".wasm");

    // Prevent webpack from bundling onnxruntime-node (native addon —
    // only used in Node/server contexts; let Node require() handle it)
    config.externals = [...(config.externals || [])];

    if (isServer) {
      // Mark onnxruntime-node as external so webpack doesn't try to bundle it
      config.externals.push("onnxruntime-node");
    }

    // Allow importing .wasm files as assets
    config.module.rules.push({
      test: /\.wasm$/,
      type: "asset/resource",
    });

    return config;
  },

  serverExternalPackages: ["@xenova/transformers", "onnxruntime-node"],
};

export default nextConfig;