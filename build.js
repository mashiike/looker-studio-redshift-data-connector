const { build: runBuild } = require("esbuild");
const dotenv = require("dotenv");
const { parsed: loadedEnvs } = dotenv.config();
const { GasPlugin } = require("esbuild-gas-plugin");
const { copy } = require("esbuild-plugin-copy");

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
  entryPoints: ["./src/app.ts"],
  bundle: true,
  outfile: "./dist/app.js",
  logLevel: "info",
  define: {
    ...Object.fromEntries(
      Object.entries(loadedEnvs ?? {}).map(([key, value]) => [`process.env.${key}`, JSON.stringify(value)])
    ),
  },
  minifyIdentifiers: false,
  plugins: [
    GasPlugin,
    copy({
      resolveFrom: "cwd",
      assets: {
        from: ["./static/**/*.*"],
        to: ["./dist"],
      },
    }),
  ],
};

runBuild(buildOptions).catch((error) => {
  console.error(error);
  process.exit(1);
});
