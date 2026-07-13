# CareWise App Review Test Plan

Use this for Apple App Review, Google Play review, TestFlight, and Android internal testing.

## Reviewer Access

- Reviewers can create a fresh patient account from the app signup screen.
- The app should not prefill reviewer credentials; enter a synthetic reviewer email and password during the test.
- If a store reviewer requires a pre-created account, create a temporary account in the production backend shortly before submission and paste those credentials only into App Store Connect or Play Console reviewer notes.
- Do not commit reviewer passwords, personal email passwords, API keys, or real patient data to this repository.
- Test accounts should use synthetic data only and should be deleted after review.

## Safe Test Scenario

1. Open CareWise AI.
2. Sign up with a reviewer test email.
3. Record consent.
4. Sync the patient profile.
5. Upload a plain text report or paste the synthetic report below.
6. Tap upload and analyze.
7. Save LDL cholesterol as a lab trend.
8. Open Legal.
9. Load privacy export summary.
10. Submit a data deletion request.

## Synthetic Report Text

This is not real patient data. Synthetic wellness report for app review only.

LDL cholesterol: 142 mg/dL, marked high.
A1C: 5.4%, in reference range.
Vitamin D: 22 ng/mL, marked low.
No chest pain, no shortness of breath, no emergency symptoms reported.

## Expected Result

- The app explains uploaded report information in simple language.
- The app avoids diagnosis, cure, treatment, prescription, and emergency-care claims.
- The app reminds users to review results with a licensed clinician.
- The app can save and reload lab trend values.
- The app exposes privacy policy, terms, medical disclaimer, privacy export summary, and data deletion request controls.

## Reviewer Notes Template

CareWise AI is an educational health-report explanation app. It is not a medical diagnosis tool and does not provide emergency care. Reviewers may create a fresh account in the app using synthetic data, or use the temporary reviewer account entered in the store-review notes. Please do not upload real protected health information during review.
