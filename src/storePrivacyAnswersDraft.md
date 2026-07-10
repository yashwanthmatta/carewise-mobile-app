# CareWise Store Privacy Answers Draft

This draft is for Apple App Privacy and Google Play Data Safety preparation. Review it with legal counsel and update it to match the final production data flows before submission.

## App Purpose

CareWise AI helps users upload health reports, understand them in simple language, save lab trend notes, and prepare questions for licensed healthcare professionals. CareWise AI is not a medical diagnosis, prescription, cure, emergency, or insurance-coverage guarantee tool.

## Data Collected

### Contact Info

- Email address for account signup, login, account support, and account-related notices.

### Health And Fitness / Health Information

- Uploaded health report files.
- Pasted report text.
- Report analysis results.
- Saved lab trend values and notes.
- User-entered profile details such as conditions, allergies, region, and insurance status.
- Consent records related to health-data processing.

### User Content

- User-provided notes, questions, uploaded files, and report text.

### Identifiers

- Internal user ID.
- Internal patient profile ID.
- Device notification token if push notifications are enabled later.

### Location

- Approximate region or location only when a user chooses doctor or insurance search features.

### Purchases

- Subscription/payment status if Stripe or another payment provider is enabled later.

## Data Use

- Account creation and authentication.
- Providing report upload, simple-language explanation, lab trends, and wellness suggestions.
- Maintaining consent history, audit history, privacy export, and deletion workflows.
- App functionality, safety, fraud prevention, and support.
- Payment/subscription handling if subscriptions are enabled.

## Data Sharing

- Backend hosting and database providers process data to operate the app.
- Private file storage provider stores uploaded reports.
- AI provider may process report text/files server-side to generate simple explanations when enabled.
- Payment provider may process subscription data when enabled.
- Do not sell health data.
- Do not use health data for third-party advertising.

## Security And Retention

- Use HTTPS in transit.
- Store session tokens in platform secure storage on the device.
- Keep AI keys and protected health processing server-side.
- Store report files in private durable storage.
- Support account data export and deletion requests.
- Do not log health report content in mobile app logs.

## Apple App Privacy Starting Answers

- Data linked to the user: email address, health information, user content, identifiers, purchases if enabled.
- Data not used for tracking: health data and report content should not be used for tracking.
- Third-party advertising: no.
- Data used for app functionality: yes.
- Data used for analytics: only if privacy-safe analytics are added later; update this answer before launch.

## Google Play Data Safety Starting Answers

- Does the app collect user data? Yes.
- Is data encrypted in transit? Yes.
- Can users request data deletion? Yes.
- Is health data collected? Yes.
- Is health data shared? Only with service providers needed to operate backend, storage, AI processing, or payments; not sold or used for ads.
- Is collection optional? Account and report data are needed for core app functionality; doctor/insurance location features are optional.

## Submission Warning

Do not submit these answers unchanged if production behavior changes. Update the forms if analytics, ads, notifications, payments, provider search, insurance search, or AI processing changes.
