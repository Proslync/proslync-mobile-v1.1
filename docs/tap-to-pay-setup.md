# Tap to Pay on iPhone — Setup Guide

Complete guide for configuring Stripe Terminal Tap to Pay across Stripe Dashboard, Apple Developer account, backend, and mobile app.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Stripe Dashboard Setup](#stripe-dashboard-setup)
3. [Apple Developer Account Setup](#apple-developer-account-setup)
4. [EAS Build & Provisioning Profiles](#eas-build--provisioning-profiles)
5. [Backend Configuration](#backend-configuration)
6. [Mobile App Configuration](#mobile-app-configuration)
7. [Testing Locally](#testing-locally)
8. [Testing on TestFlight](#testing-on-testflight)
9. [Architecture & Payment Flow](#architecture--payment-flow)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Requirement | Details |
|-------------|---------|
| **Device** | iPhone XS (2018) or later |
| **iOS** | 16.4+ (required for PIN entry support) |
| **Apple Developer Account** | Organization-level (not Individual) |
| **Stripe Account** | Test mode keys for development, live keys for production |
| **Countries** | US, UK, CA, AU, NZ, and most EU countries |

> iPad, iPhone X or older, and iOS Simulator do **not** support Tap to Pay hardware. Use the simulated reader for development.

---

## Stripe Dashboard Setup

### 1. Activate Terminal

1. Log into [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **More > Terminal**
3. Follow the activation prompts if Terminal isn't already enabled

### 2. Terminal Locations

Locations are now created **dynamically per event** by the backend. When a staff member opens Collect Payments for an event, the backend calls `stripe.terminal.locations.create()` using the event's address and caches the resulting `tml_xxx` ID on the event record.

You do **not** need to manually create locations in the Dashboard.

To view created locations:
- Dashboard > **Terminal > Locations**
- Or via API: `GET /v1/terminal/locations`

### 3. Connection Token Endpoint

The backend exposes `POST /api/terminal/connection-token` which calls `stripe.terminal.connectionTokens.create()`. This is consumed by the mobile SDK's `tokenProvider` callback.

> Never cache connection tokens — the SDK manages their lifecycle.

### 4. Verify API Keys

Ensure the following env vars are set in the backend `.env`:

```bash
STRIPE_SECRET_KEY=sk_test_...       # or sk_live_... for production
STRIPE_PUBLISHABLE_KEY=pk_test_...  # or pk_live_... for production
```

And in the mobile `.env`:

```bash
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

## Apple Developer Account Setup

This is the most time-consuming step. There are **two separate entitlements** — development and distribution.

### 1. Request Development Entitlement

1. Ensure your Apple Developer account is **Organization-level** with **Account Holder** role
2. Go to [developer.apple.com/tap-to-pay](https://developer.apple.com/tap-to-pay/)
3. Submit an entitlement request for your App ID
4. Alternatively, email `ttpoientitlements@apple.com` with your use case
5. Apple typically auto-approves in **1-2 business days**

### 2. Configure Xcode Capability

After the entitlement is granted:

1. Open the Xcode project (`ios/status.xcworkspace`)
2. Select your target > **Signing & Capabilities**
3. Click **+ Capability** > add **"Tap to Pay on iPhone"**
4. This adds `com.apple.developer.proximity-reader.payment.acceptance` to the entitlements file

The Expo config in `app.json` already declares this entitlement:

```json
{
  "ios": {
    "entitlements": {
      "com.apple.developer.proximity-reader.payment.acceptance": true
    }
  }
}
```

### 3. Regenerate Provisioning Profiles

After receiving the entitlement:

1. Go to [Apple Developer Portal > Profiles](https://developer.apple.com/account/resources/profiles/list)
2. Delete or regenerate your **Development** provisioning profile
3. The new profile will include the Tap to Pay entitlement
4. In Xcode: **Signing & Capabilities** > toggle automatic signing off/on, or manually download the new profile

### 4. Request Distribution Entitlement (for TestFlight / App Store)

The development entitlement only covers Development distribution. To ship via TestFlight or App Store:

1. **Reply to the confirmation email** you received after the development entitlement was approved
2. Request App Store / TestFlight distribution capability
3. Apple initiates a distribution review — this can take **1-4 weeks**
4. Once approved, regenerate your **Distribution** provisioning profile

> Builds uploaded to TestFlight **will fail code signing** without the distribution entitlement.

---

## EAS Build & Provisioning Profiles

This project uses **EAS Build** to build and sign iOS apps. EAS manages provisioning profiles automatically.

### Current Setup

- **EAS account:** `statusdigitalinc`
- **App Store Connect App ID:** `6758645282`
- **Build profiles:** `development` (internal), `preview` (internal), `production` (App Store)
- **Bundle ID:** `com.statusdigitalinc.status`

### Checking Entitlement Status

1. Go to [Apple Developer > Identifiers](https://developer.apple.com/account/resources/identifiers/list)
2. Click your App ID (`com.statusdigitalinc.status`)
3. Scroll to **Capabilities** — look for **"Tap to Pay on iPhone"**
4. If listed and enabled, the entitlement is granted

To verify on the provisioning profile:
1. Go to [Apple Developer > Profiles](https://developer.apple.com/account/resources/profiles/list)
2. Click the relevant profile
3. Check **Enabled Capabilities** includes "Tap to Pay on iPhone"
4. Check **Status** — if "Invalid", the profile needs regeneration

### Regenerating Invalid Profiles

When a capability is added (like Tap to Pay), existing provisioning profiles become **Invalid** and must be regenerated. With EAS, there are two options:

**Option A: Regenerate via `eas credentials` (interactive)**
```bash
eas credentials --platform ios
```
Select:
1. `production` build profile
2. **Provisioning Profile** > **Set up a new provisioning profile**

EAS generates a new profile with all enabled capabilities.

**Option B: Just rebuild (auto-regenerates)**
```bash
eas build --platform ios --profile production
```
EAS detects the invalid profile and auto-generates a new one during the build.

### Building & Submitting

```bash
# Build for App Store / TestFlight
eas build --platform ios --profile production

# Submit the latest build to TestFlight
eas submit --platform ios --latest

# Or build + submit in one command
eas build --platform ios --profile production --auto-submit
```

### Development Builds (for testing on device)

```bash
# Build development client for internal testing
eas build --platform ios --profile development
```

Note: Development builds use a different provisioning profile than production. Make sure the **Development** profile also has "Tap to Pay on iPhone" enabled in the Apple Developer portal.

---

## Backend Configuration

### Relevant Files

| File | Purpose |
|------|---------|
| `src/terminal/terminal.service.ts` | Connection tokens + location creation |
| `src/terminal/terminal.controller.ts` | `POST /api/terminal/connection-token` |
| `src/terminal/terminal.module.ts` | Module with Event repository |
| `src/events/entities/event.entity.ts` | `terminalLocationId` column |
| `src/event-attendees/event-attendees.service.ts` | Calls `getOrCreateLocation` in `getUnpaidAttendees` |
| `src/payments/payments.controller.ts` | `POST /api/events/:id/payments/collect-at-door` |

### How Dynamic Locations Work

1. Staff opens Collect Payments for an event
2. Mobile calls `GET /api/events/:eventId/attendees/unpaid`
3. Backend checks `event.terminalLocationId`:
   - **If set** — returns the cached ID (no Stripe API call)
   - **If null** — creates a new Stripe Terminal Location from `event.locationDetails` (address, city, state, postal code, country), saves the `tml_xxx` ID on the event, and returns it
4. Mobile passes `terminalLocationId` to `connectReader()`

### Database Migration

Migration `1771937395625-add-stripe-terminal-location` adds the `terminal_location_id` column to the `events` table.

Run migrations:
```bash
npm run migration:run
```

---

## Mobile App Configuration

### Relevant Files

| File | Purpose |
|------|---------|
| `lib/providers/terminal-provider.tsx` | Terminal SDK provider + `connectReader(locationId?)` |
| `app/collect-payments.tsx` | Collect Payments screen |
| `lib/api/payments.ts` | `fetchConnectionToken`, `getUnpaidAttendees`, `collectAtDoor` |
| `lib/types/payments.types.ts` | TypeScript interfaces |
| `lib/config.ts` | Stripe publishable key |

### Expo Plugins

`app.json` includes both Stripe plugins:

```json
"plugins": [
  ["@stripe/stripe-react-native", {
    "merchantIdentifier": "merchant.statusdigitalinc.status",
    "enableGooglePay": true
  }],
  ["@stripe/stripe-terminal-react-native", {
    "tapToPayCheck": true
  }]
]
```

### Known Expo Prebuild Issue

After running `npx expo prebuild`, the "Tap to Pay on iPhone" capability may be **removed** from the Xcode project. This is a [known issue](https://github.com/stripe/stripe-terminal-react-native/issues/955).

**Workaround:** After each prebuild, open Xcode and verify the capability is present on the target. Re-add it manually if needed.

---

## Testing Locally

### Simulated Reader (No Device Needed)

In development builds (`__DEV__ === true`), the Terminal SDK automatically uses a **simulated reader**:

```typescript
// terminal-provider.tsx
const { error } = await discoverReaders({
  discoveryMethod: 'tapToPay',
  simulated: __DEV__,  // true in dev
});
```

The simulated reader:
- Emulates the entire Tap to Pay flow
- Shows a simulated "Ready to Tap" UI
- Auto-completes the tap without real NFC
- Does **not** require the Apple entitlement
- Works on iOS Simulator

### Simulated Test Cards

| Card | Number | Behavior |
|------|--------|----------|
| Visa | `4242 4242 4242 4242` | Success |
| Mastercard | `5555 5555 5555 4444` | Success |
| Amex | `3782 822463 10005` | Success |
| Declined | `4000 0000 0000 0002` | Decline |

### Real Device Testing (With Entitlement)

To test actual NFC on a physical iPhone:

1. Ensure you have the **development entitlement** from Apple
2. Build with `simulated: false` (or run a release build where `__DEV__` is false)
3. Use Stripe **test mode** API keys
4. Purchase [physical test cards](https://dashboard.stripe.com/terminal/shop) from Stripe — these work with NFC in test mode
5. iPhone must have NFC enabled and be signed into an Apple ID

**Test amounts with physical test cards:**

| Decimal | Result |
|---------|--------|
| `.00` | Approved |
| `.01` | Declined (`call_issuer`) |
| `.02` | PIN required (enter `1234`) |
| `.05` | Generic decline |

> Mobile wallet testing (Apple Pay / Google Pay) is **not available** in Stripe test mode.

### Running Locally

```bash
# Start the backend
cd /path/to/status.social
npm run start:dev

# In the mobile app, set USE_LOCAL_BACKEND = true in lib/config.ts
# Update LOCAL_IP to your machine's IP

# Run on device/simulator
npx expo run:ios
```

---

## Testing on TestFlight

### Requirements

| Requirement | Status |
|-------------|--------|
| Distribution entitlement from Apple | Required — [request it](#4-request-distribution-entitlement-for-testflight--app-store) |
| Distribution provisioning profile regenerated | Required after entitlement granted |
| EAS credentials synced | Run `eas credentials` if needed |

### Build & Upload

```bash
# Build for iOS distribution
eas build --platform ios --profile production

# Submit to TestFlight
eas submit --platform ios
```

### TestFlight-Specific Notes

- The **first time** a tester opens the Tap to Pay flow, they'll see Apple's Terms and Conditions acceptance screen (handled by `tosAcceptancePermitted: true`)
- The tester must sign in with their Apple ID
- NFC must be enabled on the test device (Settings > NFC)
- The device must be in a [supported country](#prerequisites)
- iOS **beta versions are NOT supported** by Tap to Pay

### Common TestFlight Failure

If the build uploads but Tap to Pay fails on device:
1. Verify the distribution entitlement is approved
2. Regenerate the distribution provisioning profile
3. Run `eas credentials` to sync profiles with EAS
4. Rebuild and resubmit

---

## Architecture & Payment Flow

```
Mobile App                        Backend                           Stripe
────────────────────────────────────────────────────────────────────────────

1. Open Collect Payments

2. GET /attendees/unpaid    →    Fetch event + unpaid guests
                                  │
                                  ├─ event.terminalLocationId?
                                  │  ├─ YES → return cached ID
                                  │  └─ NO  → stripe.terminal
                                  │           .locations.create()
                                  │           → save on event
                                  │           → return new ID
                            ←    { guests, terminalLocationId }

3. SDK init + connect
   reader(locationId)

4. User taps "Collect"
   on a guest

5. POST /collect-at-door    →    Create PaymentIntent           →  Stripe API
   { guestId,                    (card_present for terminal)
     useTerminal: true }    ←    { clientSecret }

6. retrievePaymentIntent(secret)
   collectPaymentMethod()        ← NFC "Ready to Tap" UI →
   confirmPaymentIntent()                                       →  Charge

7. Payment succeeds         ←    WebSocket: payment_received
   Guest removed from list
```

### Key Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/terminal/connection-token` | POST | SDK connection token |
| `/api/events/:id/attendees/unpaid` | GET | Unpaid guests + terminal location |
| `/api/events/:id/payments/collect-at-door` | POST | Create PaymentIntent for terminal |

### Permissions

- Viewing unpaid guests requires `Permission.ATTENDEES_VIEW`
- Collecting payments requires `Permission.BILLING_EDIT`

---

## Troubleshooting

### "Timed out waiting for Tap to Pay reader"

- Ensure NFC is enabled on the device (Settings > NFC)
- Ensure the device is iPhone XS or later
- Check that the Apple entitlement is included in the provisioning profile
- On simulator: this shouldn't happen since `simulated: true` is used in dev

### Build fails with code signing error mentioning proximity-reader

- The provisioning profile doesn't include the Tap to Pay entitlement
- Regenerate profiles after Apple grants the entitlement
- After `expo prebuild`, verify the capability in Xcode

### "Terminal SDK not initialized yet"

- The `StripeTerminalProvider` needs to finish initializing before `connectReader` is called
- The collect-payments screen waits for `isInitialized` before connecting

### Terminal location creation fails

- Check that the event has valid `locationDetails` (addressLine1, city, state, postalCode, country)
- The backend gracefully handles this — Collect Payments still works but the reader may connect without a location
- Verify `STRIPE_SECRET_KEY` is set correctly

### Payment fails with "offline_pin_required"

- Common with UK and Canadian cards that require chip insertion
- This is a card/issuer limitation, not a code issue
- Offer a fallback payment method for these cases

### Simulated reader not working

- Verify `__DEV__` is `true` (development build)
- Ensure `simulated: __DEV__` is set in `discoverReaders()`
- Try restarting the Metro bundler
