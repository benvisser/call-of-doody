const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Config plugin to add modular_headers for GoogleUtilities pod
 * This fixes the FirebaseCoreInternal Swift compatibility issue
 */
function withModularHeaders(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );

      let podfileContent = fs.readFileSync(podfilePath, "utf8");

      // Add modular_headers for GoogleUtilities after platform declaration
      if (!podfileContent.includes("GoogleUtilities")) {
        podfileContent = podfileContent.replace(
          /(platform :ios.*\n)/,
          `$1\n# Enable modular headers for GoogleUtilities (Firebase Swift compatibility)\npod 'GoogleUtilities', :modular_headers => true\n`
        );
        fs.writeFileSync(podfilePath, podfileContent);
      }

      return config;
    },
  ]);
}

module.exports = withModularHeaders;
