const { withPodfile } = require('expo/config-plugins');

/** Google Sign-In pods need modular headers when linked statically. */
module.exports = function withModularHeaders(config) {
  return withPodfile(config, (cfg) => {
    if (!cfg.modResults.contents.includes('use_modular_headers!')) {
      cfg.modResults.contents = cfg.modResults.contents.replace(
        /use_expo_modules!\n/,
        "use_expo_modules!\n  use_modular_headers!\n",
      );
    }
    return cfg;
  });
};
