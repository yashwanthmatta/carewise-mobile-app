# CareWise Real Device QA Checklist

Run this on at least one iPhone and one Android device before public release.

## Install And First Launch

- Install the latest preview build from EAS, TestFlight, or Android internal testing.
- Confirm the CareWise icon and splash screen appear correctly.
- Confirm the app opens without a blank screen or crash.
- Confirm the backend status message is understandable if the network is slow.

## Account Flow

- Create a new patient account with a test email.
- Log out and log back in.
- Close and reopen the app to confirm secure session restore.
- Refresh the session.
- Request a password reset and confirm the message does not ask users to share health details.
- Confirm password reset with a valid token in a non-production account or email-enabled environment.
- Request email verification and confirm the token in a non-production account or email-enabled environment.
- Log out and confirm protected actions are disabled.
- Confirm logout still clears the device if the network is unavailable.

## Consent And Profile

- Record consent.
- Sync a basic patient profile.
- Confirm no diagnosis, cure, prescription, or emergency replacement wording appears.

## Report Upload

- Pick a text report and upload it.
- Pick a PDF report and upload it.
- Pick an image report and upload it.
- Confirm the app shows the selected filename and file type.
- Confirm analysis returns a simple explanation or a clear "needs readable text" result.
- Confirm scanned/unreadable files tell the user to paste readable text or ask a clinician to review the original report.

## Lab Trends

- Save a lab value such as LDL cholesterol.
- Load cloud lab values.
- Confirm saved values survive app restart.
- Confirm lab trend wording says values should be reviewed with a licensed clinician.

## Privacy And Safety

- Open Privacy Policy, Terms, Medical Disclaimer, and Data Deletion links.
- Confirm the app does not expose private storage URLs.
- Confirm no health report text appears in device logs during normal use.
- Confirm account deletion/export flow is tested from the backend or web app before public launch.

## Release Decision

Do not submit the app if any of these are true:

- A report upload can be accessed without the signed-in user.
- The app claims to diagnose, cure, prescribe, or replace medical care.
- The app crashes during signup, report upload, analysis, or logout.
- Privacy and data deletion links are missing or broken.
- A licensed reviewer has not reviewed the safety wording for high-risk use.
