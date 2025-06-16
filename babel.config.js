module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // Enable the module-resolver plugin to handle path aliases
      [
        "module-resolver",
        {
          root: ["."],
          alias: {
            "@": ".",
            "@/frontend": "./frontend",
            "@/store": "./store",
            "@/hooks": "./hooks",
            "@/lib": "./lib",
            "@/components": "./frontend/components",
          },
          extensions: [
            ".ios.ts",
            ".android.ts",
            ".ts",
            ".ios.tsx",
            ".android.tsx",
            ".tsx",
            ".jsx",
            ".js",
            ".json",
          ],
        },
      ],
    ],
  };
};
