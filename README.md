# CareWise Mobile App Starter

This is the starter structure for the future iOS and Android CareWise app.

It now includes a runnable Expo/React Native shell that points at the live backend:

`https://carewise-api.onrender.com`

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
npm run start
```

Then open the app with Expo Go on your phone, or press `i` for iOS simulator / `a` for Android emulator if installed.

## Build For Store Testing

Install EAS CLI when you are ready to make installable builds:

```bash
npm install -g eas-cli
eas login
eas build:configure
eas build --platform android --profile preview
eas build --platform ios --profile preview
```

Use preview builds for TestFlight/internal Android testing before public store submission.

## Current Files

- `app.json` - Expo configuration starter
- `App.tsx` - mobile screen shell
- `package.json` - Expo scripts/dependencies
- `src/apiClient.ts` - shared backend API client
- `src/navigationPlan.md` - mobile screen flow
- `src/safetyRules.md` - mobile health safety rules
- `src/appStorePrivacyChecklist.md` - Apple/Google privacy prep

## Important

Do not put API keys in the mobile app.

All AI, medical safety logic, and protected health processing should happen server-side.

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
- Refresh-token session support
- Verify current user via backend
- Record consent
- Sync basic patient profile
- Paste report text
- Upload report record
- Analyze report
- Legal links to the deployed CareWise pages

Binary PDF/image upload is still a next step for mobile. The current starter supports selecting a file but asks the user to paste readable report text before upload.
