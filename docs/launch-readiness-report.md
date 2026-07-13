# CareWise Mobile Launch Readiness Report

Generated from the local mobile project configuration.

## App Identity

- App name: CareWise AI
- Expo name: CareWise
- Version: 0.1.0
- iOS bundle ID: com.carewise.app
- Android package: com.carewise.app
- iOS build number: 1
- Android version code: 1
- Backend API: https://carewise-api.onrender.com

## Automated Gates

- [x] `ci:check` script exists
- [x] `version:check` script exists
- [x] `release:check` script exists
- [x] `store:check` script exists
- [x] `review:check` script exists
- [x] `launch:report` script exists
- [x] `launch:smoke` script exists
- [x] `backend:check` script exists
- [x] `auth:smoke` script exists
- [x] `report:smoke` script exists
- [x] `build:preflight` script exists
- [x] `build:android:preview` script exists
- [x] `build:ios:preview` script exists
- [x] Store listing includes non-diagnostic wording
- [x] Reviewer test plan uses synthetic data
- [x] Release checklist includes submission blockers

## Store Submission Packet

- Apple category: Health & Fitness
- Google Play category: Health & Fitness
- Support URL: https://carewise-frontend.onrender.com/legal/data-deletion.html
- Privacy Policy URL: https://carewise-frontend.onrender.com/legal/privacy.html
- Terms URL: https://carewise-frontend.onrender.com/legal/terms.html
- Medical Disclaimer URL: https://carewise-frontend.onrender.com/legal/disclaimer.html
- Data Deletion URL: https://carewise-frontend.onrender.com/legal/data-deletion.html

## Screenshot Plan

- Home: Simple CareWise AI purpose and non-diagnostic positioning
- Report upload: PDF/image/text upload with safe explanation wording
- Report result: Risk/status and clinician-review language, not diagnosis
- Lab trends: Saved lab values and clinician interpretation reminder
- Legal: Privacy policy, disclaimer, export summary, and deletion request controls

## Human Blockers Before Public Launch

- Do not submit before legal review of privacy policy, terms, medical disclaimer, and deletion workflow.
- Do not submit before clinician review of high-risk wording.
- Do not submit if backend storage is not private.
- Do not submit if Apple App Privacy or Google Play Data Safety answers do not match production behavior.
- Apple Developer account access and paid agreement must be active.
- Google Play Console account access must be active.
- TestFlight and Android internal testing must pass on real devices.
- Legal, privacy, and clinician review must be completed before real patient use.

## Safe Review Notes

- CareWise AI explains uploaded health reports in simple language for education and visit preparation.
- CareWise AI is not a medical diagnosis tool and does not provide emergency care.
- Users can request data deletion in the mobile Legal screen and through the public data deletion page.
- Test accounts used for review should not include real protected health information.

## Next Commands

```bash
npm run ci:check
npm run version:check
npm run launch:report
npm run launch:smoke
npm run backend:check
npm run auth:smoke
npm run report:smoke
npm run eas:login
npm run build:android:preview
npm run build:ios:preview
```
