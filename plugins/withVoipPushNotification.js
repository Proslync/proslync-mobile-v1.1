const {
  withEntitlementsPlist,
  withInfoPlist,
  withXcodeProject,
  withAppDelegate,
  IOSConfig,
} = require('expo/config-plugins');

/**
 * Expo config plugin to enable VoIP push notifications on iOS.
 * Single CXProvider architecture — handles BOTH incoming and outgoing calls.
 * - Adds PushKit.framework + CallKit.framework to the Xcode project
 * - Adds aps-environment entitlement
 * - Ensures voip + remote-notification background modes are present
 * - Adds PushKit delegate + CallKit provider delegate to AppDelegate.swift
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

  // 3. Add PushKit.framework and CallKit.framework to the Xcode project
  config = withXcodeProject(config, (config) => {
    const xcodeProject = config.modResults;
    const target = IOSConfig.XcodeUtils?.getApplicationNativeTarget?.({
      project: xcodeProject,
      projectName: config.modRequest.projectName,
    });

    if (target) {
      xcodeProject.addFramework('PushKit.framework', { target: target.uuid });
      xcodeProject.addFramework('CallKit.framework', { target: target.uuid });
    } else {
      xcodeProject.addFramework('PushKit.framework');
      xcodeProject.addFramework('CallKit.framework');
    }

    return config;
  });

  // 4. Add PushKit + CallKit delegate methods to AppDelegate.swift
  config = withAppDelegate(config, (config) => {
    if (config.modResults.language !== 'swift') {
      return config;
    }

    let contents = config.modResults.contents;

    // Add PushKit and CallKit imports if not present
    if (!contents.includes('import PushKit')) {
      contents = contents.replace(
        'import Expo',
        'import Expo\nimport PushKit\nimport CallKit'
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

// MARK: - CallKit Provider Delegate (single provider for all calls)
class VoipCallKitDelegate: NSObject, CXProviderDelegate {
  // Maps CallKit UUID -> callId from push payload or outgoing call
  var uuidToCallId: [UUID: String] = [:]
  // Reverse map: callId -> UUID (for ending/connecting calls from JS)
  var callIdToUuid: [String: UUID] = [:]
  // Pending answer actions — deferred until JS confirms call connected
  var pendingAnswerActions: [String: CXAnswerCallAction] = [:]

  func providerDidReset(_ provider: CXProvider) {
    // Fail any pending answer actions
    for (_, action) in pendingAnswerActions {
      action.fail()
    }
    pendingAnswerActions.removeAll()
    uuidToCallId.removeAll()
    callIdToUuid.removeAll()
  }

  func provider(_ provider: CXProvider, perform action: CXAnswerCallAction) {
    let callId = uuidToCallId[action.callUUID] ?? action.callUUID.uuidString

    // Store the action — DO NOT fulfill yet. JS will call fulfillAnswerAction
    // after the accept API call succeeds and LiveKit connects.
    // CallKit shows "Connecting..." until we fulfill.
    pendingAnswerActions[callId] = action

    // Post to JS so it can call the accept API
    NotificationCenter.default.post(
      name: NSNotification.Name("VoipCallAnswered"),
      object: nil,
      userInfo: ["callId": callId, "callUUID": action.callUUID.uuidString]
    )

    // Safety timeout: fulfill after 10 seconds if JS hasn't responded
    DispatchQueue.main.asyncAfter(deadline: .now() + 10) { [weak self] in
      if let pending = self?.pendingAnswerActions.removeValue(forKey: callId) {
        print("[VoipPush] Answer action timeout — auto-fulfilling for callId: \\(callId)")
        pending.fulfill()
      }
    }
  }

  func fulfillAnswer(callId: String) {
    if let action = pendingAnswerActions.removeValue(forKey: callId) {
      action.fulfill()
    }
  }

  func failAnswer(callId: String) {
    if let action = pendingAnswerActions.removeValue(forKey: callId) {
      action.fail()
    }
  }

  func provider(_ provider: CXProvider, perform action: CXEndCallAction) {
    let callId = uuidToCallId[action.callUUID] ?? action.callUUID.uuidString

    // If there's a pending answer action, fail it
    if let pending = pendingAnswerActions.removeValue(forKey: callId) {
      pending.fail()
    }

    NotificationCenter.default.post(
      name: NSNotification.Name("VoipCallEnded"),
      object: nil,
      userInfo: ["callId": callId, "callUUID": action.callUUID.uuidString]
    )

    uuidToCallId.removeValue(forKey: action.callUUID)
    callIdToUuid.removeValue(forKey: callId)
    action.fulfill()
  }

  func provider(_ provider: CXProvider, perform action: CXStartCallAction) {
    let callId = uuidToCallId[action.callUUID] ?? action.callUUID.uuidString

    // Configure audio session for the call
    provider.reportOutgoingCall(with: action.callUUID, startedConnectingAt: nil)

    action.fulfill()
  }

  // Helper to register a callId <-> UUID mapping
  func registerCall(callId: String, uuid: UUID) {
    uuidToCallId[uuid] = callId
    callIdToUuid[callId] = uuid
  }

  func cleanup(callId: String) {
    if let uuid = callIdToUuid.removeValue(forKey: callId) {
      uuidToCallId.removeValue(forKey: uuid)
    }
    pendingAnswerActions.removeValue(forKey: callId)
  }
}

// MARK: - PushKit VoIP Push
extension AppDelegate: PKPushRegistryDelegate {
  private static var voipCallProvider: CXProvider = {
    let providerConfig = CXProviderConfiguration()
    providerConfig.supportsVideo = true
    providerConfig.maximumCallGroups = 1
    providerConfig.maximumCallsPerCallGroup = 1
    return CXProvider(configuration: providerConfig)
  }()

  private static let callKitDelegate = VoipCallKitDelegate()
  private static let callController = CXCallController()

  // Must be stored as a property — a local variable gets deallocated immediately
  // and PushKit never delivers the token.
  private static var voipRegistry: PKPushRegistry?

  func registerForVoipPush() {
    AppDelegate.voipCallProvider.setDelegate(AppDelegate.callKitDelegate, queue: DispatchQueue.main)

    let registry = PKPushRegistry(queue: DispatchQueue.main)
    registry.delegate = self
    registry.desiredPushTypes = [.voIP]
    AppDelegate.voipRegistry = registry

    // Listen for JS commands via NSNotification
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleStartOutgoingCall(_:)),
      name: NSNotification.Name("VoipStartOutgoingCall"),
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleReportCallConnected(_:)),
      name: NSNotification.Name("VoipReportCallConnected"),
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleFulfillAnswerAction(_:)),
      name: NSNotification.Name("VoipFulfillAnswerAction"),
      object: nil
    )
    NotificationCenter.default.addObserver(
      self,
      selector: #selector(handleEndCall(_:)),
      name: NSNotification.Name("VoipEndCall"),
      object: nil
    )
  }

  // MARK: - JS command handlers

  @objc private func handleStartOutgoingCall(_ notification: Notification) {
    guard let info = notification.userInfo,
          let callId = info["callId"] as? String,
          let callerName = info["callerName"] as? String else { return }
    let isVideo = info["isVideo"] as? Bool ?? false

    let uuid = UUID()
    AppDelegate.callKitDelegate.registerCall(callId: callId, uuid: uuid)

    let handle = CXHandle(type: .generic, value: callId)
    let startAction = CXStartCallAction(call: uuid, handle: handle)
    startAction.contactIdentifier = callerName
    startAction.isVideo = isVideo

    let transaction = CXTransaction(action: startAction)
    AppDelegate.callController.request(transaction) { error in
      if let error = error {
        print("[VoipPush] Failed to start outgoing call: \\(error.localizedDescription)")
      }
    }
  }

  @objc private func handleReportCallConnected(_ notification: Notification) {
    guard let info = notification.userInfo,
          let callId = info["callId"] as? String,
          let uuid = AppDelegate.callKitDelegate.callIdToUuid[callId] else { return }

    AppDelegate.voipCallProvider.reportOutgoingCall(with: uuid, connectedAt: nil)
  }

  @objc private func handleFulfillAnswerAction(_ notification: Notification) {
    guard let info = notification.userInfo,
          let callId = info["callId"] as? String else { return }

    AppDelegate.callKitDelegate.fulfillAnswer(callId: callId)
  }

  @objc private func handleEndCall(_ notification: Notification) {
    guard let info = notification.userInfo,
          let callId = info["callId"] as? String else { return }

    if let uuid = AppDelegate.callKitDelegate.callIdToUuid[callId] {
      let endAction = CXEndCallAction(call: uuid)
      let transaction = CXTransaction(action: endAction)
      AppDelegate.callController.request(transaction) { error in
        if let error = error {
          print("[VoipPush] Failed to end call: \\(error.localizedDescription)")
          // Force-report the call as ended if CXTransaction fails
          AppDelegate.voipCallProvider.reportCall(with: uuid, endedAt: nil, reason: .remoteEnded)
          AppDelegate.callKitDelegate.cleanup(callId: callId)
        }
      }
    }
  }

  // MARK: - PushKit delegate

  public func pushRegistry(_ registry: PKPushRegistry, didUpdate pushCredentials: PKPushCredentials, for type: PKPushType) {
    let token = pushCredentials.token.map { String(format: "%02x", $0) }.joined()
    // Persist so the Expo module can read it even if JS hasn't loaded yet
    UserDefaults.standard.set(token, forKey: "VoipPushToken")
    NotificationCenter.default.post(
      name: NSNotification.Name("VoipPushTokenReceived"),
      object: nil,
      userInfo: ["token": token]
    )
  }

  public func pushRegistry(_ registry: PKPushRegistry, didReceiveIncomingPushWith payload: PKPushPayload, for type: PKPushType, completion: @escaping () -> Void) {
    let dictionaryPayload = payload.dictionaryPayload

    let callId = dictionaryPayload["callId"] as? String ?? UUID().uuidString
    let callerName = dictionaryPayload["callerName"] as? String ?? "Unknown"
    let isVideo = dictionaryPayload["isVideo"] as? Bool ?? false

    // CRITICAL: Must report to CallKit synchronously in this callback or iOS kills the app
    let update = CXCallUpdate()
    update.remoteHandle = CXHandle(type: .generic, value: callId)
    update.localizedCallerName = callerName
    update.hasVideo = isVideo
    update.supportsGrouping = false
    update.supportsUngrouping = false
    update.supportsHolding = false
    update.supportsDTMF = false

    let callUUID = UUID()
    // Store mapping so delegate can resolve callId from UUID
    AppDelegate.callKitDelegate.registerCall(callId: callId, uuid: callUUID)

    AppDelegate.voipCallProvider.reportNewIncomingCall(with: callUUID, update: update) { error in
      if let error = error {
        print("[VoipPush] Failed to report incoming call to CallKit: \\(error.localizedDescription)")
        AppDelegate.callKitDelegate.cleanup(callId: callId)
      }
      completion()
    }

    // Persist call payload to UserDefaults for cold-launch resilience
    var jsPayload: [String: Any] = [:]
    for (key, value) in dictionaryPayload {
      if let key = key as? String {
        jsPayload[key] = value
      }
    }
    jsPayload["_callkitUUID"] = callUUID.uuidString
    if let data = try? JSONSerialization.data(withJSONObject: jsPayload) {
      UserDefaults.standard.set(data, forKey: "VoipPendingCallPayload")
    }

    // Post to JS via Expo module (for state updates — CallKit already handles the UI)
    NotificationCenter.default.post(
      name: NSNotification.Name("VoipPushNotificationReceived"),
      object: nil,
      userInfo: jsPayload
    )
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

  return config;
}

module.exports = withVoipPushNotification;
