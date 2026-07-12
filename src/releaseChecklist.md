# CareWise Mobile Release Checklist

Use this before TestFlight, Android internal testing, and public store submission.

## Code Readiness

- Run `npm run typecheck`.
- Follow `src/deviceQaChecklist.md`.
- Run `npm run phone` and test on a real iPhone and Android device.
- Verify signup, login, saved session restore, refresh, logout, consent, profile sync, report file upload, report analysis, and lab trend save/load.
- Confirm report uploads reach backend storage and are removed by the data deletion workflow.
- Confirm no health report text, access tokens, or API keys are printed in app logs.

## Backend Readiness

- Render backend health endpoint returns OK.
- Production database is attached.
- Cloudflare R2 or S3 storage is configured with private bucket access.
- OpenAI API key is set only in backend environment variables.
- JWT secret and field encryption key are strong production values.
- Privacy export and deletion endpoints are tested with a real account.

## Store Build Commands

```bash
npm run release:check
npm run backend:check
npm run auth:smoke
npm run report:smoke
npm run typecheck
npm run build:preflight
npm run eas:login
npm run build:android:preview
npx eas build --platform ios --profile preview
npx eas build --platform android --profile production
npx eas build --platform ios --profile production
```

## Human Approval Required

- Apple Developer Program account.
- Google Play Console account.
- Legal review of Privacy Policy, Terms, Medical Disclaimer, and Data Deletion Request page.
- Apple App Privacy answers.
- Google Play Data Safety answers.
- Review and finalize `src/storePrivacyAnswersDraft.md`.
- Clinician review of safety wording and high-risk escalation behavior.

## Do Not Submit If

- The app promises diagnosis, cure, treatment, or guaranteed insurance coverage.
- Uploads are public or accessible without authorization.
- The backend logs protected health information.
- Account deletion does not remove stored report files.
