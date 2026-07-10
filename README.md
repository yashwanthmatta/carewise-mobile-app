# CareWise Mobile App Starter

This is the starter structure for the future iOS and Android CareWise app.

It now includes a runnable Expo/React Native shell that points at the live backend:

`https://carewise-api.onrender.com`

A GitHub CI workflow template is included at `docs/github-workflows/mobile-ci.yml`. To enable it later, copy it to `.github/workflows/mobile-ci.yml` using a GitHub token with `workflow` scope.

Recommended path:

- Expo + React Native
- Shared API client
- Patient onboarding and consent
- Symptom intake
- Medication organizer
- Weekly check-ins
- Report upload and report analysis
- Care plan result
- Clinician dashboard / review status
- Manual subscription checkout first, Stripe later
- Privacy policy, terms, medical disclaimer, and data deletion screens
- Data export/delete settings

## First Local Setup

```bash
cd /Users/yashwanthmatta/Documents/Codex/2026-06-14/okay-i-want-to-build-a/outputs/carewise-mobile-app
npm install
npm run release:check
npm run backend:check
npm run build:preflight
npm run start
```

Then open the app with Expo Go on your phone, or press `i` for iOS simulator / `a` for Android emulator if installed.

## Build For Store Testing

Use the local EAS CLI installed in this project when you are ready to make installable builds:

```bash
npm run release:check
npm run backend:check
npm run build:preflight
npm run eas:login
npm run build:android:preview
npm run build:ios:preview
```

Use preview builds for TestFlight/internal Android testing before public store submission.

## Current Files

- `app.json` - Expo configuration starter
- `assets/` - CareWise app icon and splash assets
- `App.tsx` - mobile screen shell
- `package.json` - Expo scripts/dependencies
- `src/apiClient.ts` - shared backend API client
- `src/navigationPlan.md` - mobile screen flow
- `src/safetyRules.md` - mobile health safety rules
- `src/appStorePrivacyChecklist.md` - Apple/Google privacy prep
- `src/storePrivacyAnswersDraft.md` - draft Apple App Privacy and Google Play Data Safety answers
- `src/finalLaunchStage.md` - final-stage launch readiness map
- `src/releaseChecklist.md` - concrete build, test, and submission checklist
- `src/deviceQaChecklist.md` - real iOS/Android device testing checklist
- `src/storeListingDraft.md` - first App Store / Google Play listing copy
- `docs/github-workflows/mobile-ci.yml` - CI workflow template to enable after GitHub token has `workflow` scope

## Important

Do not put API keys in the mobile app.

All AI, medical safety logic, and protected health processing should happen server-side.

The app reads its backend URL from `app.json` at `expo.extra.apiBaseUrl`. Change that config value for staging or production builds instead of editing `App.tsx`.

## MVP Screen Contract

- Auth: signup, login, logout, signed-in identity, password reset placeholder
- Patient: profile, consent history, medications, weekly check-ins
- Reports: upload file metadata, paste/OCR report text, analyze, show risk and next steps
- Care: intake, monthly plan, diet, exercise, doctor summary, save/export
- Clinician: review queue, decision status, audit trail
- Payments: plan selection and checkout placeholder
- Legal: privacy, terms, medical disclaimer, deletion request

Before App Store or Google Play submission, complete Apple App Privacy details and Google Play Data Safety answers from the real data flows.

## Current Mobile MVP

- Sign up / login
- Password reset request and confirm flow
- Secure device session persistence with logout
- Backend refresh-token revocation on logout
- Refresh-token session support
- Verify current user via backend
- Record consent
- Sync basic patient profile
- Paste report text
- Pick PDF/image/text reports from the phone
- Upload report files to backend storage
- Analyze report
- Save and reload lab trends through the backend
- Legal links to the deployed CareWise pages

PDF/image/text file upload is wired to the backend multipart report API. Users can still paste readable text to improve analysis when a scanned file has no extractable text.

## Store-Blocking Items Still Required

- Apple Developer account team selection and paid agreement.
- Google Play Console account and app setup.
- Final screenshots and store listing approval.
- Human-reviewed Privacy Policy, Terms, Medical Disclaimer, and Data Deletion workflow.
- Apple App Privacy and Google Play Data Safety forms that match production data flows.
- TestFlight / internal Android testing with real devices before public release.
- Store-ready secure session QA on iOS and Android preview builds.
