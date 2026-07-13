# CareWise Mobile Release Versioning

Use this before every TestFlight, Android internal testing, or production store build.

## Current Release Identity

- Marketing version: `0.1.0`
- iOS bundle ID: `com.carewise.app`
- Android package: `com.carewise.app`
- iOS build number: `1`
- Android version code: `1`

## Rules

- Keep `package.json` `version` and `app.json` `expo.version` identical.
- Never change the iOS bundle ID or Android package after store setup.
- Let EAS production builds auto-increment store build numbers.
- Run `npm run version:check` before every preview or production build.
- Bump the marketing version only when user-visible release scope changes.

## Beginner Flow

```bash
npm run version:check
npm run ci:check
npm run launch:smoke
npm run build:android:preview
npm run build:ios:preview
```
