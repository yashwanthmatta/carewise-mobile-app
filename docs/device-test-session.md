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

## Part 4: wrap-up (5 min)

Ask the tester:
- "What was hardest to do?"
- "Was anything worrying or unclear?"
- "Would you use this for a parent's report?"

Fill in the release checklist. Any failure marked ★ there blocks release.

## Afterwards

Send the filled-in checklist and notes to the team. Clinical wording concerns go to the clinical
reviewer, not straight into the app; the explanation rules are versioned and under review.
