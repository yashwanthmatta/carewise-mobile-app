# Google Play readiness

Last checked: 2026-10-23. Status key: ✅ verified · 🟡 done, needs a person to confirm · ⛔ blocker ·
⬜ not started.

**Overall: technically build-ready (the bundle compiles; target API meets the 2026 rule); not
submission-ready.** Blockers: billing decision, Play Console account and signing, Data Safety and
Health declarations, closed testing, real-device and TalkBack testing, and clinical, legal and
security sign-off. **Nothing is published without the owner's explicit approval.**

## Build and configuration

| Item | Status | Evidence / next step |
|---|---|---|
| Production JavaScript bundle builds | ✅ | `npx expo export --platform android` produced a 2 MB Hermes bundle (2026-10-22) |
| Target API 36 (required for new apps and updates from 2026-08-31) | ✅ | React Native 0.88 defaults: targetSdk 36, compileSdk 37, minSdk 24 ([Android](https://developer.android.com/google/play/requirements/target-sdk)) |
| Application ID `com.followthroughhealth.app`, versionCode 1 | ✅ | `app.json`; EAS auto-increments production builds |
| Android App Bundle (AAB) | 🟡 | The EAS `production` profile builds an AAB by default (`preview` builds an APK for testing). Run `eas build -p android --profile production` |
| Permissions: only what's used | ✅ | Fixed 2026-10-23. Expo's defaults added READ/WRITE_EXTERNAL_STORAGE, SYSTEM_ALERT_WINDOW and VIBRATE, which the app doesn't use. `app.json` now blocks them, and the generated manifest has only INTERNET (checked with `expo prebuild`) |
| Adaptive icon | ✅ | `assets/adaptive-icon.png` 1024×1024 |
| App signing (Play App Signing) | ⛔ | Owner: create the Play Console developer account. EAS can generate the upload key; enrol in Play App Signing |
| Crash reporting | ⬜ | None (Play Console's Android vitals give basic crash data). A crash SDK needs owner approval |

## Policy

| Item | Status | Evidence / next step |
|---|---|---|
| **Paid plans: Google Play Billing** | ⛔ | "Start checkout" opens Stripe for a digital subscription. Play requires Google Play Billing for this (limited alternative-billing programmes exist). **Owner decision**, same options as Apple: remove purchase from the app for v1 (recommended), add Play Billing, or enrol in an eligible programme |
| Health apps declaration (required for every app) | ⬜ | Play Console → App content. Declare health features honestly: lab-report education, medicine reminders ([Google](https://support.google.com/googleplay/android-developer/answer/14738291)) |
| Health and Medical policy: no misleading claims; disclaimer | 🟡 | Education-only positioning and disclaimers. Avoid "clinically validated" until the review is signed |
| Data Safety form | 🟡 | Draft answers in `src/storePrivacyAnswersDraft.md`: account email, health info the user saves, AI processing of help-chat questions (Anthropic), crash/diagnostics only if an SDK is added. Data is encrypted in transit; deletion is available in the app and on the web |
| Account and data deletion (in the app and via a web link) | ✅ | In-app delete; web page `followthroughhealth.com/legal/data-deletion.html` |
| Privacy policy URL | ✅ | followthroughhealth.com/legal/privacy.html |
| Content rating questionnaire | ⬜ | Play Console |

## Testing and listing

| Item | Status | Evidence / next step |
|---|---|---|
| Closed testing (new personal developer accounts must run a closed test with testers before production) | ⬜ | Check the requirement for your account type in Play Console. Use synthetic reports only |
| Real Android device and TalkBack test | ⬜ | `docs/device-test-session.md` |
| Store listing: description, screenshots, feature graphic | 🟡 | Text drafts in `src/storeListingDraft.md`; screenshots from a real build |
| Production API connectivity | ✅ | `extra.apiBaseUrl` is `https://carewise-api.onrender.com`; the live API smoke check passes |

## Before pressing Publish (all required)

CI green · billing decision done · clinical sign-off for the live rules version · security review ·
legal review · closed test and TalkBack pass · owner's explicit approval.
