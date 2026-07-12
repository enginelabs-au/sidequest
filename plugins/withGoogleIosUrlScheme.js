const { withInfoPlist, IOSConfig, createRunOncePlugin } = require('expo/config-plugins');

function withGoogleIosUrlScheme(config, options) {
  const scheme = options?.iosUrlScheme?.trim();
  if (!scheme) return config;

  return withInfoPlist(config, (cfg) => {
    if (!IOSConfig.Scheme.hasScheme(scheme, cfg.modResults)) {
      cfg.modResults = IOSConfig.Scheme.appendScheme(scheme, cfg.modResults);
    }
    return cfg;
  });
}

module.exports = createRunOncePlugin(
  withGoogleIosUrlScheme,
  'sidequest-google-ios-url-scheme',
  '1.0.0',
);
