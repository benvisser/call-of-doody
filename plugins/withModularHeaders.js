const { withPodfile } = require('@expo/config-plugins');

/**
 * Config plugin to add use_modular_headers! and use_frameworks! for Firebase compatibility
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

    // Add use_frameworks with static linkage for @react-native-firebase
    if (!podfile.includes("use_frameworks! :linkage => :static")) {
      podfile = podfile.replace(
        /use_modular_headers!\n/,
        (match) => `${match}\n# Use static frameworks for @react-native-firebase compatibility\nuse_frameworks! :linkage => :static\n`
      );
    }

    config.modResults.contents = podfile;
    return config;
  });
};

module.exports = withModularHeaders;
