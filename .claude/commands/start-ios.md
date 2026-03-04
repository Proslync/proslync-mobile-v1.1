# Start iOS App on Simulator

Build and run the Status iOS app on the iOS Simulator.

## Steps

1. Set up node: `export PATH="/Users/sri/.nvm/versions/node/v24.12.0/bin:$PATH"`
2. Navigate to the project: `cd /Users/sri/Pictures/status`
3. Check if a simulator is already booted: `xcrun simctl list devices booted`
   - If no simulator is booted, boot one: `xcrun simctl boot "iPhone 16e"`
4. Run the app on the simulator: `npx expo run:ios`
   - If a specific device is needed: `npx expo run:ios --device "iPhone 16e"`
5. If the build fails due to pods:
   - `cd ios && pod install && cd ..`
   - Retry the build

## Important

- Project path: `/Users/sri/Pictures/status`
- Xcode workspace: `/Users/sri/Pictures/status/ios/status.xcworkspace`
- Node path: `/Users/sri/.nvm/versions/node/v24.12.0/bin`
- This is an Expo (React Native) project using expo-router
- The iOS native project is in the `ios/` subdirectory
