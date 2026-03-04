const {
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
  withAppDelegate,
  withDangerousMod,
  IOSConfig,
} = require('expo/config-plugins');
const fs = require('fs');
const path = require('path');

/**
 * Expo config plugin to enable VoIP push notifications on iOS.
 * - Adds PushKit.framework to the Xcode project
 * - Adds aps-environment entitlement
 * - Ensures voip + remote-notification background modes are present
 * - Adds PushKit delegate methods to AppDelegate.swift
 * - Adds RNVoipPushNotificationManager import to bridging header
 */
function withVoipPushNotification(config) {
  // 1. Add aps-environment entitlement
  config = withEntitlementsPlist(config, (config) => {
    config.modResults['aps-environment'] =
      config.modResults['aps-environment'] || 'development';
    return config;
  });

  // 2. Ensure UIBackgroundModes includes voip and remote-notification
  config = withInfoPlist(config, (config) => {
    const modes = config.modResults.UIBackgroundModes || [];
    if (!modes.includes('voip')) {
      modes.push('voip');
    }
    if (!modes.includes('remote-notification')) {
      modes.push('remote-notification');
    }
    config.modResults.UIBackgroundModes = modes;
    return config;
  });

  // 3. Add PushKit.framework to the Xcode project
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const target = IOSConfig.XcodeUtils?.getApplicationNativeTarget?.({
      project: xcodeProject,
      projectName: config.modRequest.projectName,
    });

    if (target) {
      xcodeProject.addFramework('PushKit.framework', {
        target: target.uuid,
      });
    } else {
      xcodeProject.addFramework('PushKit.framework');
    }

    return config;
  });

  // 4. Add PushKit delegate methods to AppDelegate.swift
  config = withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      return config;
    }

    let contents = config.modResults.contents;

    // Add PushKit import if not present
    if (!contents.includes('import PushKit')) {
      contents = contents.replace(
        'import Expo',
        'import Expo\nimport PushKit'
      );
    }

    // Add the PushKit delegate extension if not present
    if (!contents.includes('PKPushRegistryDelegate')) {
      // Register for VoIP push in didFinishLaunchingWithOptions
      contents = contents.replace(
        'return super.application(application, didFinishLaunchingWithOptions: launchOptions)',
        `registerForVoipPush()\n    return super.application(application, didFinishLaunchingWithOptions: launchOptions)`
      );

      // Add the extension at the end of the file
      contents += `

// MARK: - PushKit VoIP Push
extension AppDelegate: PKPushRegistryDelegate {
  func registerForVoipPush() {
    let voipRegistry = PKPushRegistry(queue: DispatchQueue.main)
    voipRegistry.delegate = self
    voipRegistry.desiredPushTypes = [.voIP]
  }

  public func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
    RNVoipPushNotificationManager.didUpdate(pushCredentials, forType: type.rawValue)
  }

  public func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
    RNVoipPushNotificationManager.didReceiveIncomingPush(with: payload, forType: type.rawValue)
    completion()
  }

  public func pushRegistry(_ registry: PKPushRegistry, didInvalidatePushTokenFor type: PKPushType) {
    // Token invalidated
  }
}
`;
    }

    config.modResults.contents = contents;
    return config;
  });

  // 5. Add RNVoipPushNotificationManager to bridging header
  config = withDangerousMod(config, [
    'ios',
    (config) => {
      const projectName = config.modRequest.projectName;
      const bridgingHeaderPath = path.join(
        config.modRequest.platformProjectRoot,
        projectName,
        `${projectName}-Bridging-Header.h`
      );

      if (fs.existsSync(bridgingHeaderPath)) {
        let contents = fs.readFileSync(bridgingHeaderPath, 'utf-8');
        const importLine = '#import <RNVoipPushNotificationManager.h>';
        if (!contents.includes(importLine)) {
          contents += `\n${importLine}\n`;
          fs.writeFileSync(bridgingHeaderPath, contents);
        }
      }

      return config;
    },
  ]);

  return config;
}

module.exports = withVoipPushNotification;
