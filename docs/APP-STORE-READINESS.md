# Apple App Store readiness

Last checked: 2026-10-23. Status key: ✅ verified in code or by a check · 🟡 done, needs a person to
confirm · ⛔ blocker · ⬜ not started.

**Overall: technically build-ready (the bundle compiles); not submission-ready.** Blockers: signing and Apple account, real-device and VoiceOver testing, clinical, legal and
security sign-off. **Nothing is submitted without the owner's explicit approval.**

## Build and configuration

| Item | Status | Evidence / next step |
|---|---|---|
| Production JavaScript bundle builds | ✅ | `npx expo export --platform ios` produced a 2 MB Hermes bundle (2026-10-22) |
| Toolchain: Xcode 26 / iOS 26 SDK required for uploads since 2026-04-28 | 🟡 | Expo SDK 58 with EAS Build. Confirm the EAS image uses Xcode 26 on the first `eas build` ([Apple](https://developer.apple.com/news/upcoming-requirements/), [Expo](https://expo.dev/blog/app-store-connect-minimum-sdk-26)) |
| Bundle ID `com.followthroughhealth.app`, version 0.1.0, build 1 | ✅ | `app.json`; EAS manages build numbers (`appVersionSource: remote`, `autoIncrement`) |
| App icon 1024×1024 with no alpha channel | ✅ | `assets/icon.png` flattened to RGB (Apple rejects icons with an alpha channel) |
| Launch screen | ✅ | `assets/splash.png` |
| Encryption export flag | ✅ | `ITSAppUsesNonExemptEncryption: false` (HTTPS only) |
| Permissions and usage strings | ✅ | No camera, photo library, location or contacts permissions are requested. Files come from the system document picker, which needs no permission |
| Privacy manifest (required-reason APIs) | 🟡 | AsyncStorage and Expo modules ship their own `PrivacyInfo.xcprivacy`. Check the generated manifest in the first build's archive |
| Signing: Apple Developer Program, certificates, provisioning | ⛔ | Owner: enrol, then `eas login` and `eas build -p ios --profile production` (EAS creates the certificates) |
| Crash reporting | ⬜ | None installed. Adding Sentry or similar adds a data processor, so it needs owner approval and a privacy-policy update |

## Policy

| Item | Status | Evidence / next step |
|---|---|---|
| Account deletion inside the app (5.1.1(v)) | ✅ | Profile → Delete account (`App.tsx`), calls the API, confirms first |
| **Paid plans (3.1.1 in-app purchase)** | ✅ | Resolved 2026-10-23, owner approved removing purchase from the app for v1. The app sells nothing: plan picker, "Start checkout" and the Stripe billing link are removed, and the screen says "Nothing is sold in this app". No feature in the app or on the server is locked behind a plan. `npm run release:check` fails if checkout or payment links come back. Plans stay on the website |
| Health and medical claims (1.4.1) | 🟡 | Positioned as education; no diagnosis or medicine names; disclaimers in the app. Wording must avoid "clinically validated" until the review is signed |
| Privacy policy URL and in-app links | ✅ | Links point to followthroughhealth.com (`App.tsx`, `src/storeSubmissionPacket.json`) |
| App Privacy answers | 🟡 | Draft in `src/storePrivacyAnswersDraft.md`; the public page is `legal/app-store-disclosures.html` (under legal review) |
| Third-party AI disclosure | 🟡 | The help chat sends the question to Anthropic; this must appear in the App Privacy answers and privacy policy (it already does on the website) |

## Listing and review

| Item | Status | Evidence / next step |
|---|---|---|
| Name, subtitle, description, keywords, support URL | 🟡 | `src/storeListingDraft.md`, `src/storeSubmissionPacket.json` (checked by `npm run store:check`) |
| Screenshots (6.9" and 6.5" iPhone, iPad if `supportsTablet`) | ⬜ | Take from a real build with synthetic reports. **Note:** `supportsTablet: true` means iPad screenshots and iPad testing are also required; set it to false if iPad isn't a goal |
| App Review notes and demo account | ⬜ | Provide a test account with synthetic data, plus a note that it's education only and how to try a sample report |
| TestFlight build and testing | ⬜ | After signing |
| Real iPhone and VoiceOver test | ⬜ | `docs/device-test-session.md`, `docs/accessibility-device-checklist.md` |

## Before pressing Submit (all required)

CI green · clinical sign-off for the live rules version · security review (database access,
encryption decision) · legal review of claims and privacy · real-device and VoiceOver pass ·
owner's explicit approval.
