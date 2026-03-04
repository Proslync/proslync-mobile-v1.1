# Deploy

Save backend with formatting checks, then build and deploy the frontend to the physical iPhone.

## Step 1: Backend — Format, Lint & Push

1. Navigate to the backend repo at `/Users/sri/Pictures/status-backend/status.social`
2. Set up node: `export HOME=/Users/sri; source /Users/sri/.nvm/nvm.sh; nvm use 20`
3. Check `git status` for any uncommitted changes
4. If there are changes:
   - Run prettier to fix formatting: `./node_modules/.bin/prettier --write "src/**/*.ts" "test/**/*.ts"`
   - Run eslint to check for errors: `./node_modules/.bin/eslint "src/**/*.ts" --fix`
   - Verify prettier passes: `./node_modules/.bin/prettier --check "src/**/*.ts" "test/**/*.ts"`
   - Stage all relevant source files (do NOT stage `.env` or other secret files)
   - Create a descriptive commit summarizing the changes
   - Push to `origin develop`
5. If CI fails, fix the issues, commit, and push again

## Step 2: Frontend — Build & Deploy to iPhone

1. Navigate to the frontend repo at `/Users/sri/Pictures/status`
2. Set up node: `export HOME=/Users/sri; source /Users/sri/.nvm/nvm.sh; nvm use 20`
3. Run pod install (node must be in PATH):
   ```
   /Users/sri/.gem/ruby/2.6.0/bin/pod install
   ```
   (Run from the `ios/` directory)
4. Build with xcodebuild:
   ```
   xcodebuild -workspace /Users/sri/Pictures/status/ios/status.xcworkspace \
     -scheme status \
     -sdk iphoneos \
     -configuration Debug \
     -destination 'id=00008120-000E3DE1222B601E' \
     -allowProvisioningUpdates \
     NODE_BINARY="/Users/sri/.nvm/versions/node/v20.20.0/bin/node" \
     DEVELOPMENT_TEAM=S75634U885
   ```
5. Install the built app on iPhone:
   ```
   xcrun devicectl device install app \
     --device 00008120-000E3DE1222B601E \
     /Users/sri/Library/Developer/Xcode/DerivedData/status-ckcxhriobhhxqbgizaeyofcizdsw/Build/Products/Debug-iphoneos/status.app
   ```
6. Launch the app:
   ```
   xcrun devicectl device process launch \
     --device 00008120-000E3DE1222B601E \
     com.statusdigitalinc.status
   ```

## Important

- Backend repo: `/Users/sri/Pictures/status-backend/status.social` — branch `develop`, remote `origin`
- Frontend repo: `/Users/sri/Pictures/status` — branch `main`
- iPhone device ID: `00008120-000E3DE1222B601E` (iPhone 14 Pro Max)
- Development team: `S75634U885`
- Pod binary: `/Users/sri/.gem/ruby/2.6.0/bin/pod`
- Node (v20): `/Users/sri/.nvm/versions/node/v20.20.0/bin/node`
- NVM setup: `export HOME=/Users/sri; source /Users/sri/.nvm/nvm.sh; nvm use 20`
- Do NOT pass `SKIP_BUNDLING` to xcodebuild — it breaks JS bundling
- Never commit `.env` files
- If pod install fails, make sure node is in PATH first
- If build fails due to codegen, run pod install to regenerate
