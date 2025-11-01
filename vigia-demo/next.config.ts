/** @type {import('next').NextConfig} */
interface TurboRules {
  [key: string]: {
    type: string;
  };
}

interface TurboConfig {
  rules: TurboRules;
}

interface ExperimentalConfig {
  turbo: TurboConfig;
}

interface WebpackConfig {
  resolve: {
    fallback?: {
      [key: string]: boolean;
    };
  };
}

interface NextConfig {
  webpack: (config: WebpackConfig) => WebpackConfig;
  experimental: ExperimentalConfig;
}

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
  experimental: {
    turbo: {
      rules: {
        '*.wasm': {
          type: 'asset',
        },
      },
    },
  },
};

module.exports = nextConfig;