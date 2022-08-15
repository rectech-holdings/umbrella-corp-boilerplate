const createExpoWebpackConfigAsync = require("@expo/webpack-config");
const thisPackageJson = require("./package.json");
const webpack = require("webpack");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  config.plugins.push(
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": process.env.NODE_ENV || "development",
    }),
  );

  //This ensures that peerDependencies inside dependencies (like when the dep wants react or react-dom) get resolved from THIS directory, not inside the requiring dependency
  config.resolve.plugins.push({
    apply(resolver) {
      resolver.plugin("module", function (req, callback) {
        if (thisPackageJson.dependencies[req.request]) {
          this.doResolve(
            "resolve",
            {
              ...req,
              request: require.resolve(req.request),
            },
            "MonoRepo Resolver",
            callback,
          );
        } else {
          callback();
        }
      });
    },
  });

  return config;
};
