Pod::Spec.new do |s|
  s.name           = 'VoipPush'
  s.version        = '1.0.0'
  s.summary        = 'Expo module for VoIP push notifications'
  s.description    = 'Local Expo module bridging PushKit VoIP push token and notification events to JS'
  s.license        = 'MIT'
  s.author         = 'Status'
  s.homepage       = 'https://github.com/anthropics'
  s.platforms      = { :ios => '14.0' }
  s.swift_version  = '5.4'
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
    'SWIFT_COMPILATION_MODE' => 'wholemodule'
  }

  s.source_files = "**/*.{h,m,swift}"
end
