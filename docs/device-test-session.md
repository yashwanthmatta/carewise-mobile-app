# Real-phone test session (about 30 minutes per phone)

One person, one phone, one sitting. Run it once on an **iPhone** and once on an **Android phone**,
ideally with someone who isn't on the team. Use made-up reports only: the built-in sample, or the
three synthetic labs in the website repo's `docs/pilot-sample-labs/`. Record results on the release
checklist, `docs/accessibility-device-checklist.md`.

## Before the session

- **Website:** nothing to install. Open **followthroughhealth.com** in Safari (iPhone) or Chrome (Android).
- **Phone app:** until store test builds exist, run `npm run phone` on a laptop and scan the QR code
  with **Expo Go**. Once EAS builds are made (`npm run build:ios:preview` and
  `npm run build:android:preview`, which need the Expo account), use TestFlight or Google Play
  internal testing instead.
- Write down the phone model, OS version and app build (or "website").

## Part 1: normal use (10 min)

1. Open the website. Without help, add sample lab 2 (thyroid and kidney) and read the explanation.
   Check that "Far above the lab's range" shows for TSH and creatinine.
2. Add sample lab 3 (potassium 6.8). Check that the urgent message ("contact your doctor today…")
   shows, as words and not only colour.
3. Open the doctor brief and the share button. Tap **Listen** and then **Stop**.
4. Repeat steps 1–2 in the phone app.
5. Note anything confusing, slow, or that needed help.

## Part 2: screen reader (10 min)

1. Turn on **VoiceOver** (iPhone: Settings → Accessibility → VoiceOver) or **TalkBack** (Android:
   Settings → Accessibility → TalkBack). Practise the swipe gestures for one minute.
2. With the screen reader only, add sample lab 3 and listen to the result. Check the summary is read
   before the result cards, and the urgent message is read out.
3. Find "What happens to my data?" and open it.
4. Switch the language to Español, and check the Spanish text is read.

## Part 3: large text and zoom (5 min)

1. Set text size to the largest (iPhone: Display & Text Size → Larger Text; Android: Font size and
   Display size to maximum). Reopen the result: nothing should overlap or be cut off.
2. In the browser, zoom to 200%. The summary and cards should be readable without scrolling sideways.

## Part 4: app functions (about 15 min per phone)

Use a test account and made-up reports only. Never use a real person's report, name or phone number.
Mark each row **Pass**, **Fail** (say what happened) or **N/A**, once for the iPhone and once for the
Android phone. **Nothing below has been tested on a real phone yet.** Automated checks and a browser
preview are not device evidence, so this table stays blank until someone fills it in on a phone.

| # | Step | What should happen | iPhone | Android |
|---|---|---|---|---|
| 1 | **Sign in.** Account → sign in with the test account. Close the app fully and reopen it. | Still signed in after reopening. | | |
| 2 | **Secure storage.** Sign out, close the app fully, reopen it. | Still signed out: reopening does not sign you back in. | | |
| 3 | **Upload.** Pick file → choose a made-up PDF or photo of a lab report. | The file name and size show, and it can be explained or uploaded. | | |
| 4 | **Explanation.** Try a sample report → Explain on this phone. | The summary comes first, then cards with each value, unit and label. A sample marked urgent shows the urgent message in words. | | |
| 5 | **Read aloud.** On the explained report, tap **Listen**, then **Stop**. Repeat with the phone on silent, and once with Bluetooth headphones. | Nothing plays until Listen. It starts with the summary, says "6 point 8 millimoles per liter" (not "mmol slash L"), and stops on Stop, on leaving the screen and when the phone locks. Note what the silent switch does. | | |
| 6 | **AI Health Guide.** Ask "What does eGFR mean?", then "What is Dolo 650?", then "Are you a real doctor?". | A plain answer for eGFR. For Dolo 650, an answer if the online helper is on, or, while it is off, "The health assistant is temporarily unavailable. Please try again shortly." No dose advice either way. "No" to the doctor question. | | |
| 7 | **Emergency words.** In the guide, type "chest pain". | The 911 / emergency message, shown at once (it is answered on the phone, not sent). | | |
| 8 | **Saved records.** Signed in: Upload + analyze a made-up report, then open Reports. | It is listed, and opening it shows the same values. | | |
| 9 | **Reminders.** Signed in: Record → Add a reminder (made-up name, times 08:00, 20:00), with phone calls **off**. | It is saved and listed with today's times. "Mark taken" changes it to Taken. Delete (tap twice to confirm) removes it. The app sends no phone notifications. Reminders are saved to the account and shown here. | | |
| 10 | **Screen reader.** Repeat 4–6 with VoiceOver / TalkBack on. | Every button is announced with a name. Listen does not talk over the screen reader in a confusing way. | | |

Phone model and OS: iPhone ________ / Android ________. App build: ________. Tester: ________. Date: ________.

## Part 5: wrap-up (5 min)

Ask the tester:
- "What was hardest to do?"
- "Was anything worrying or unclear?"
- "Would you use this for a parent's report?"

Fill in the release checklist. Any failure marked ★ there blocks release.

## Afterwards

Send the filled-in checklist and notes to the team. Clinical wording concerns go to the clinical
reviewer, not straight into the app; the explanation rules are versioned and under review.
