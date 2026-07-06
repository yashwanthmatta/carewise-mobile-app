# App Store Privacy Checklist

This must be reviewed before Apple App Store or Google Play submission.

## Data Categories

- Account email
- Health information entered by the user
- Uploaded report text/files
- Saved lab trend values and notes
- Medication and allergy information
- Consent history
- Subscription/payment status
- Device notification token
- Approximate location or region for doctor/insurance search

## Required User Controls

- Consent before health planning
- Privacy policy link
- Terms of service link
- Doctor disclaimer
- Data export request
- Data deletion request
- Lab trend save/load controls
- Notification opt-in and opt-out
- Clear sign-out control that removes saved session tokens from the device

## Store Forms

- Apple App Privacy details must match actual collected data.
- Google Play Data Safety form must match actual collected data.
- Do not claim the app diagnoses, cures, or replaces licensed care.

## Security Notes

- Do not store API keys in the mobile app.
- Store user session tokens only in platform secure storage.
- Do not log health data.
- Keep AI processing and protected health logic server-side.
