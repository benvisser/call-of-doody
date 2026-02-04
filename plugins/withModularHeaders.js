const { withPodfile } = require('@expo/config-plugins');

/**
 * Config plugin to add use_modular_headers! globally for Firebase compatibility
 */
const withModularHeaders = (config) => {
  return withPodfile(config, (config) => {
    const podfile = config.modResults.contents;

    // Check if use_modular_headers! is already present
    if (!podfile.includes('use_modular_headers!')) {
      // Add use_modular_headers! after the platform line
      config.modResults.contents = podfile.replace(
        /platform :ios.*\n/,
        (match) => `${match}\n# Enable modular headers globally for Firebase compatibility\nuse_modular_headers!\n`
      );
    }

    return config;
  });
};

module.exports = withModularHeaders;
