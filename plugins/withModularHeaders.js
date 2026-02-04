const { withPodfile } = require('@expo/config-plugins');

/**
 * Config plugin to add use_modular_headers! for Firebase compatibility
 */
const withModularHeaders = (config) => {
  return withPodfile(config, (config) => {
    let podfile = config.modResults.contents;

    // Add use_modular_headers! after the platform line if not present
    if (!podfile.includes('use_modular_headers!')) {
      podfile = podfile.replace(
        /platform :ios.*\n/,
        (match) => `${match}\n# Enable modular headers globally for Firebase compatibility\nuse_modular_headers!\n`
      );
    }

    config.modResults.contents = podfile;
    return config;
  });
};

module.exports = withModularHeaders;
