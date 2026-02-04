const { withPodfile } = require('@expo/config-plugins');

/**
 * Config plugin to configure Firebase compatibility for React Native
 * Uses $RNFirebaseAsStaticFramework which is the officially recommended approach
 */
const withModularHeaders = (config) => {
  return withPodfile(config, (config) => {
    let podfile = config.modResults.contents;

    // Remove any existing global use_modular_headers! (causes conflicts with RN modules)
    podfile = podfile.replace(/\n# Enable modular headers globally for Firebase compatibility\nuse_modular_headers!\n/g, '\n');
    podfile = podfile.replace(/\nuse_modular_headers!\n/g, '\n');

    // Add $RNFirebaseAsStaticFramework at the top, after requires but before platform
    // This is the officially recommended way to integrate Firebase with React Native
    if (!podfile.includes('$RNFirebaseAsStaticFramework')) {
      podfile = podfile.replace(
        /(require 'json'[\s\S]*?rescue \{\})/,
        `$1\n\n# Firebase configuration - build as static framework to avoid modular header conflicts\n$RNFirebaseAsStaticFramework = true`
      );
    }

    config.modResults.contents = podfile;
    return config;
  });
};

module.exports = withModularHeaders;
