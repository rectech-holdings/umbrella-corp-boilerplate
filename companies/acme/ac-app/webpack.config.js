const createExpoWebpackConfigAsync = require("@expo/webpack-config");

module.exports = async function (env, argv) {
  env.mode = "development";
  env.devtool = "inline-source-map";
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Customize the config before returning it.
  return config;
};
