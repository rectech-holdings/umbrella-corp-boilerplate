const { makeMetroConfig } = require("@rnx-kit/metro-config");
const MetroSymlinksResolver = require("@rnx-kit/metro-resolver-symlinks");

module.exports = makeMetroConfig({
  projectRoot: __dirname,
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
  resolver: {
    resolveRequest: MetroSymlinksResolver({
      remapModule: (context, moduleName, platform) => {
        //If a symlinked package has a peer dependency on react-native (aka typed-router), the resolver blows up.
        if (moduleName.match(/^(react-native|react-native-screens)$/)) {
          return require.resolve(moduleName);
        }
        return moduleName;
      },
    }),
  },
});
