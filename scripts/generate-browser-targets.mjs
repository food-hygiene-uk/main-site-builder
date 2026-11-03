import browserslist from 'browserslist';
import fs from 'node:fs';
import path from 'node:path';

// Import the essential database parser from caniuse-lite
import lite from 'caniuse-lite';
const { features, feature: unpackFeature } = lite;

/**
Normalizes version strings into comparable floats or semantic versions.

* @param {string} versionString - The version string to normalize (e.g., "10.0", "10.0.1", "all", "TP")
* @returns {number} - The normalized version number
*/
function parseVersion(versionString) {
  if (!versionString || versionString === 'all' || versionString === 'TP') {
    return Infinity;
  }
  const baseVersion = versionString.split('-');
  const parsed = Number(baseVersion[0]);
  return Number.isNaN(parsed) ? Infinity : parsed;
}

/**
Checks if a specific feature status indicates native support.
Can I Use codes: 'y' = fully supported, 'n' = not supported, 'a' = partial support.

* @param {string} status - The feature status string to check
* @returns {boolean} - True if the feature is natively supported, false otherwise
*/
function isSupported(status) {
  // If it starts with 'y' (yes), it's natively supported
  return status && status.startsWith('y');
}

/**
Generates a browser compatibility profile based on Browserslist targets and feature support data.
*/
function generateProfile() {
  try {
    // 1. Resolve Browserslist minimum targets from .browserslistrc
    const supportedBrowsers = browserslist();
    const minimums = {};

    for (const entry of supportedBrowsers) {
      const [browserName, versionString] = entry.split(' ', 2);
      const currentMin = minimums[browserName];
      const parsedCurrent = parseVersion(currentMin);
      const parsedIncoming = parseVersion(versionString);

      if (!currentMin || parsedIncoming < parsedCurrent) {
        minimums[browserName] = versionString;
      }
    };

    const polyfillChecklist = [];

    for (const [featureId, packedFeatureData] of Object.entries(features)) {
      let requiresPolyfill = false;
      const reasons = [];

      try {
        const featureData = unpackFeature(packedFeatureData);

        if (featureData && featureData.stats) {
          // Check our minimum target versions against this feature's stats
          for (const [browserName, minVersion] of Object.entries(minimums)) {
            const browserStats = featureData.stats[browserName];

            if (browserStats) {
              const versionStatus = browserStats[minVersion];

              // If the status isn't fully supported ('y'), log it as a gap
              if (!isSupported(versionStatus)) {
                requiresPolyfill = true;
                reasons.push(`${browserName} ${minVersion} lacks native support (status: "${versionStatus || 'unknown'}")`);
              }
            } else {
              // Browser data missing entirely for this feature
              requiresPolyfill = true;
              reasons.push(`${browserName} data missing for this feature`);
            }
          };
        }
      } catch {
        // Fallback flag if a feature key is missing from local database version
        requiresPolyfill = true;
        reasons.push(`Could not verify support in local caniuse-lite db`);
      }

      if (requiresPolyfill && reasons.length > 0) {
        polyfillChecklist.push({
          featureId: featureId,
          title: features[featureId].title || featureId,
          reasons: reasons
        });
      }
    };

    // 3. Compose and output the unified ecosystem payload
    const outputPayload = {
      timestamp: new Date().toISOString(),
      minimumVersions: minimums,
      requiredPolyfillsAndFallbacks: polyfillChecklist
    };

    const outputPath = path.join(process.cwd(), './agents/minimum-browsers.json');
    fs.writeFileSync(outputPath, JSON.stringify(outputPayload, null, 2), 'utf8');

    console.log(`✅ Profile successfully generated at: ${outputPath}`);
    console.log(`Found ${polyfillChecklist.length} missing features requiring a polyfill configuration.`);

  } catch (error) {
    console.error('❌ Error compiling environment profile:', error.message);
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1);
  }
}

generateProfile();
