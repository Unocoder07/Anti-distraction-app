const { withAndroidManifest } = require('@expo/config-plugins');

/**
 * Expo Config Plugin for App Blocker
 * Adds necessary permissions and service declarations to AndroidManifest.xml
 */
const withAppBlocker = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    // Add permissions
    if (!androidManifest['uses-permission']) {
      androidManifest['uses-permission'] = [];
    }

    const permissions = [
      'android.permission.SYSTEM_ALERT_WINDOW',
      'android.permission.PACKAGE_USAGE_STATS',
      'android.permission.FOREGROUND_SERVICE',
      'android.permission.WAKE_LOCK',
      'android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS',
    ];

    permissions.forEach((permission) => {
      if (!androidManifest['uses-permission'].find((p) => p.$?.['android:name'] === permission)) {
        androidManifest['uses-permission'].push({
          $: { 'android:name': permission },
        });
      }
    });

    // Add service declaration
    const application = androidManifest.application[0];
    
    if (!application.service) {
      application.service = [];
    }

    // Add AppBlockerService
    const blockerService = {
      $: {
        'android:name': '.appblocker.AppBlockerService',
        'android:permission': 'android.permission.BIND_ACCESSIBILITY_SERVICE',
        'android:exported': 'false',
      },
      'intent-filter': [
        {
          action: [
            {
              $: { 'android:name': 'android.accessibilityservice.AccessibilityService' },
            },
          ],
        },
      ],
      'meta-data': [
        {
          $: {
            'android:name': 'android.accessibilityservice',
            'android:resource': '@xml/accessibility_service_config',
          },
        },
      ],
    };

    // Check if service already exists
    const serviceExists = application.service.find(
      (s) => s.$?.['android:name'] === '.appblocker.AppBlockerService'
    );

    if (!serviceExists) {
      application.service.push(blockerService);
    }

    // Add BlockerActivity
    if (!application.activity) {
      application.activity = [];
    }

    const blockerActivity = {
      $: {
        'android:name': '.appblocker.BlockerActivity',
        'android:theme': '@android:style/Theme.Translucent.NoTitleBar',
        'android:launchMode': 'singleInstance',
        'android:excludeFromRecents': 'true',
        'android:exported': 'false',
      },
    };

    const activityExists = application.activity.find(
      (a) => a.$?.['android:name'] === '.appblocker.BlockerActivity'
    );

    if (!activityExists) {
      application.activity.push(blockerActivity);
    }

    return config;
  });
};

module.exports = withAppBlocker;
