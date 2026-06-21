const { withAndroidManifest } = require("@expo/config-plugins");

/** Package names Shield checks for — must match AppBlockerModule.kt KNOWN_DISTRACTING_PACKAGES */
const DISTRACTING_PACKAGES = [
  "com.instagram.android",
  "com.facebook.katana",
  "com.facebook.lite",
  "com.snapchat.android",
  "com.zhiliaoapp.musically",
  "com.ss.android.ugc.trill",
  "com.twitter.android",
  "com.reddit.frontpage",
  "com.pinterest",
  "com.linkedin.android",
  "com.instagram.barcelona",
  "com.google.android.youtube",
  "com.netflix.mediaclient",
  "com.amazon.avod.thirdpartyclient",
  "in.startv.hotstar",
  "com.google.android.apps.youtube.music",
  "com.whatsapp",
  "org.telegram.messenger",
  "com.discord",
  "com.tencent.ig",
  "com.dts.freefireth",
  "com.dts.freefiremax",
  "com.activision.callofduty.shooter",
  "com.supercell.clashofclans",
  "com.supercell.clashroyale",
  "com.king.candycrushsaga",
  "com.innersloth.spacemafia",
  "com.mojang.minecraftpe",
  "com.garena.game.codm",
  "com.ea.gp.fifamobile",
  "com.roblox.client",
  "com.pubg.imobile",
  "com.ludo.king",
  "com.kiloo.subwaysurf",
];

/**
 * Expo Config Plugin for App Blocker
 * Adds Usage Access, package visibility queries, and Focus Protection declarations.
 */
const withAppBlocker = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults.manifest;

    if (!androidManifest["uses-permission"]) {
      androidManifest["uses-permission"] = [];
    }

    const permissions = [
      "android.permission.PACKAGE_USAGE_STATS",
      "android.permission.QUERY_ALL_PACKAGES",
      "android.permission.POST_NOTIFICATIONS",
      "android.permission.RECEIVE_BOOT_COMPLETED",
    ];

    permissions.forEach((permission) => {
      if (
        !androidManifest["uses-permission"].find(
          (p) => p.$?.["android:name"] === permission,
        )
      ) {
        androidManifest["uses-permission"].push({
          $: { "android:name": permission },
        });
      }
    });

    // Android 11+ package visibility — required to detect installed apps
    if (!androidManifest.queries) {
      androidManifest.queries = [{}];
    }
    const queries = androidManifest.queries[0];
    if (!queries.package) {
      queries.package = [];
    }

    DISTRACTING_PACKAGES.forEach((packageName) => {
      if (!queries.package.find((p) => p.$?.["android:name"] === packageName)) {
        queries.package.push({ $: { "android:name": packageName } });
      }
    });

    // Also allow querying apps with launcher intent
    if (!queries.intent) {
      queries.intent = [];
    }
    const hasLauncherQuery = queries.intent.find(
      (i) =>
        i.action?.some(
          (a) => a.$?.["android:name"] === "android.intent.action.MAIN",
        ) &&
        i.category?.some(
          (c) => c.$?.["android:name"] === "android.intent.category.LAUNCHER",
        ),
    );
    if (!hasLauncherQuery) {
      queries.intent.push({
        action: [{ $: { "android:name": "android.intent.action.MAIN" } }],
        category: [
          { $: { "android:name": "android.intent.category.LAUNCHER" } },
        ],
      });
    }

    const application = androidManifest.application[0];

    if (!application.service) {
      application.service = [];
    }

    application.service = application.service.filter((service) => {
      const name = service.$?.["android:name"];
      return (
        !name?.startsWith("com.sankalai.appblocker.") ||
        name === "com.sankalai.appblocker.FocusProtectionService"
      );
    });

    const blockerService = {
      $: {
        "android:name": "com.sankalai.appblocker.FocusProtectionService",
        "android:permission": "android.permission.BIND_ACCESSIBILITY_SERVICE",
        "android:exported": "false",
        "android:label": "@string/accessibility_service_label",
      },
      "intent-filter": [
        {
          action: [
            {
              $: {
                "android:name":
                  "android.accessibilityservice.AccessibilityService",
              },
            },
          ],
        },
      ],
      "meta-data": [
        {
          $: {
            "android:name": "android.accessibilityservice",
            "android:resource": "@xml/accessibility_service_config",
          },
        },
      ],
    };

    const serviceExists = application.service.find(
      (s) =>
        s.$?.["android:name"] ===
        "com.sankalai.appblocker.FocusProtectionService",
    );

    if (!serviceExists) {
      application.service.push(blockerService);
    }

    if (!application.activity) {
      application.activity = [];
    }

    const blockerActivity = {
      $: {
        "android:name": "com.sankalai.appblocker.BlockerActivity",
        "android:theme": "@android:style/Theme.NoTitleBar.Fullscreen",
        "android:finishOnTaskLaunch": "true",
        "android:launchMode": "singleTask",
        "android:excludeFromRecents": "true",
        "android:exported": "false",
        "android:noHistory": "true",
      },
    };

    const activityExists = application.activity.find(
      (a) =>
        a.$?.["android:name"] === "com.sankalai.appblocker.BlockerActivity",
    );

    if (!activityExists) {
      application.activity.push(blockerActivity);
    }

    if (!application.receiver) {
      application.receiver = [];
    }

    const bootReceiver = {
      $: {
        "android:name": "com.sankalai.appblocker.SmartFocusBootReceiver",
        "android:enabled": "true",
        "android:exported": "false",
      },
      "intent-filter": [
        {
          action: [
            { $: { "android:name": "android.intent.action.BOOT_COMPLETED" } },
          ],
        },
      ],
    };

    const receiverExists = application.receiver.find(
      (r) =>
        r.$?.["android:name"] ===
        "com.sankalai.appblocker.SmartFocusBootReceiver",
    );

    if (!receiverExists) {
      application.receiver.push(bootReceiver);
    }

    return config;
  });
};

module.exports = withAppBlocker;
