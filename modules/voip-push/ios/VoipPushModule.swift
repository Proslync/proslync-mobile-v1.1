import ExpoModulesCore

public class VoipPushModule: Module {
  private var latestToken: String?
  private var queuedEvents: [(name: String, body: [String: Any])] = []
  private var hasListeners = false

  public func definition() -> ModuleDefinition {
    Name("VoipPush")

    Events("onVoipToken", "onVoipNotification", "onCallAnswered", "onCallEnded")

    OnCreate {
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.handleTokenReceived(_:)),
        name: NSNotification.Name("VoipPushTokenReceived"),
        object: nil
      )
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.handleNotificationReceived(_:)),
        name: NSNotification.Name("VoipPushNotificationReceived"),
        object: nil
      )
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.handleCallAnswered(_:)),
        name: NSNotification.Name("VoipCallAnswered"),
        object: nil
      )
      NotificationCenter.default.addObserver(
        self,
        selector: #selector(self.handleCallEnded(_:)),
        name: NSNotification.Name("VoipCallEnded"),
        object: nil
      )
    }

    OnDestroy {
      NotificationCenter.default.removeObserver(self)
    }

    OnStartObserving {
      self.hasListeners = true

      // Check UserDefaults for a token that arrived before the module initialized
      if self.latestToken == nil, let storedToken = UserDefaults.standard.string(forKey: "VoipPushToken") {
        self.latestToken = storedToken
        self.queuedEvents.insert((name: "onVoipToken", body: ["token": storedToken]), at: 0)
      }

      // Check UserDefaults for a pending call payload (cold launch case)
      if let data = UserDefaults.standard.data(forKey: "VoipPendingCallPayload"),
         let payload = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
        // Insert at the beginning so payload arrives before answer/end events
        self.queuedEvents.insert((name: "onVoipNotification", body: payload), at: self.latestToken != nil ? 1 : 0)
        // Clear so it doesn't replay on every app launch
        UserDefaults.standard.removeObject(forKey: "VoipPendingCallPayload")
      }

      // Defer flush to next run loop iteration — gives JS time to register all listeners
      let eventsToFlush = self.queuedEvents
      self.queuedEvents.removeAll()
      DispatchQueue.main.async { [weak self] in
        guard let self = self, self.hasListeners else { return }
        for event in eventsToFlush {
          self.sendEvent(event.name, event.body)
        }
      }
    }

    OnStopObserving {
      self.hasListeners = false
    }

    Function("getToken") { () -> String? in
      return self.latestToken ?? UserDefaults.standard.string(forKey: "VoipPushToken")
    }

    // Start an outgoing call via the single native CXProvider
    Function("startOutgoingCall") { (callId: String, callerName: String, isVideo: Bool) in
      NotificationCenter.default.post(
        name: NSNotification.Name("VoipStartOutgoingCall"),
        object: nil,
        userInfo: ["callId": callId, "callerName": callerName, "isVideo": isVideo]
      )
    }

    // Tell CallKit the call connected (audio flowing)
    Function("reportCallConnected") { (callId: String) in
      NotificationCenter.default.post(
        name: NSNotification.Name("VoipReportCallConnected"),
        object: nil,
        userInfo: ["callId": callId]
      )
    }

    // Tell native to fulfill the pending CXAnswerCallAction (call accepted + connected)
    Function("fulfillAnswerAction") { (callId: String) in
      NotificationCenter.default.post(
        name: NSNotification.Name("VoipFulfillAnswerAction"),
        object: nil,
        userInfo: ["callId": callId]
      )
    }

    // End a call via the native CXProvider
    Function("endCall") { (callId: String) in
      NotificationCenter.default.post(
        name: NSNotification.Name("VoipEndCall"),
        object: nil,
        userInfo: ["callId": callId]
      )
    }
  }

  @objc private func handleTokenReceived(_ notification: Notification) {
    guard let token = notification.userInfo?["token"] as? String else { return }
    self.latestToken = token
    let body: [String: Any] = ["token": token]
    if hasListeners {
      sendEvent("onVoipToken", body)
    } else {
      queuedEvents.append((name: "onVoipToken", body: body))
    }
  }

  @objc private func handleNotificationReceived(_ notification: Notification) {
    guard let payload = notification.userInfo else { return }
    var body: [String: Any] = [:]
    for (key, value) in payload {
      if let key = key as? String {
        body[key] = value
      }
    }
    if hasListeners {
      sendEvent("onVoipNotification", body)
    } else {
      queuedEvents.append((name: "onVoipNotification", body: body))
    }
  }

  @objc private func handleCallAnswered(_ notification: Notification) {
    guard let info = notification.userInfo,
          let callId = info["callId"] as? String else { return }
    let body: [String: Any] = ["callId": callId]
    if hasListeners {
      sendEvent("onCallAnswered", body)
    } else {
      queuedEvents.append((name: "onCallAnswered", body: body))
    }
  }

  @objc private func handleCallEnded(_ notification: Notification) {
    guard let info = notification.userInfo,
          let callId = info["callId"] as? String else { return }
    let body: [String: Any] = ["callId": callId]
    if hasListeners {
      sendEvent("onCallEnded", body)
    } else {
      queuedEvents.append((name: "onCallEnded", body: body))
    }
  }
}
