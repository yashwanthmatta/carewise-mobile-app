# Real-device accessibility checklist

Run on at least one iPhone (latest iOS) and one Android phone (latest Android), using the
production build. Do the website section in each phone's main browser (Safari on iPhone,
Chrome on Android). Use made-up reports only, such as the built-in sample or Report A and B
from the website repo's `docs/usability-test-kit.md`.

Mark each line **Pass**, **Fail** (write what happened) or **N/A**. Any Fail on a line marked ★
blocks release.

Device: ________  OS version: ________  App build: ________  Tester: ________  Date: ________

## 1. Screen reader (VoiceOver on iPhone, TalkBack on Android)

- ★ Homepage and app start screen: the first thing read is what the product does, then the add-report action.
- ★ The add-report button or drop box is announced as a button, with a clear name.
- ★ After explaining a report, the summary is read **before** the result cards and next steps.
- ★ Urgent message (Report A, glucose 45): the "contact your doctor today / emergency care" message is
  read as text, not only shown by colour.
- ★ Each result card reads the test name, the number with its unit, and the label (for example
  "Far above the lab's range") in that order.
- ★ "Check this number" prompts for photo-read numbers can be reached and answered with the screen reader alone.
- "Show the line from your report" opens and the line is read out.
- "What happens to my data?" opens and every line is read.
- Language switch to Español: the screen reader switches to Spanish pronunciation, or at least reads the Spanish text.
- Listen button (website): starts and stops; it does not talk over the screen reader in a confusing way.
- Listen button (app, iPhone and Android): nothing plays until it is pressed; Stop works; speech stops when you switch language, leave the report, or lock the phone; results like "6.8 mmol/L" and "<0.04" are said as "6 point 8 millimoles per liter" and "less than 0 point 0 4"; Spanish uses a Spanish voice. Check once with the iPhone ring/silent switch on silent and note what happens.
- Doctor brief and share sheet open, and the screen reader can reach their buttons.
- Medicine reminders: adding a reminder, the time picker and "Mark taken" all work with the screen reader.
- No button is announced only as "button" or "unlabelled".

## 2. Large text and zoom

- ★ iPhone: Settings → Accessibility → Display & Text Size → Larger Text at the largest size.
  Android: Font size and Display size at maximum. The summary, cards and buttons stay readable,
  nothing overlaps, and nothing is cut off.
- ★ Website in the phone browser zoomed to 200%: no sideways scrolling needed to read the summary or cards.
- Website at 400% zoom (or browser text size 200%): the main flow (add report → summary → doctor brief) still works.
- Landscape orientation works on the result screen.

## 3. Touch and motion

- ★ Every button and link can be tapped easily with one thumb (target at least 44 × 44 points),
  and nearby targets are not tapped by mistake.
- Works with "Reduce Motion" (iPhone) or "Remove animations" (Android) turned on.
- Nothing needs a swipe, shake or long-press without an alternative.

## 4. Colour and contrast

- ★ Status is never shown by colour alone: "outside the lab's range", "far above" and urgent
  messages all have words.
- Readable with Dark Mode on (the website is light-only; check it isn't inverted badly).
- Readable with the phone's colour filters turned on (iPhone: Color Filters; Android: Color correction).
- Readable outdoors at about half screen brightness.

## 5. Keyboard and switch access (spot check)

- With a Bluetooth keyboard, Tab moves through the website's add-report flow in order, and focus is
  always visible.
- Android Switch Access or iPhone Switch Control can reach "Explain report" and the doctor brief.

## 6. Results

| Section | Pass | Fail | Notes |
|---|---|---|---|
| Screen reader | | | |
| Large text and zoom | | | |
| Touch and motion | | | |
| Colour and contrast | | | |
| Keyboard and switch | | | |

Release decision: ☐ No ★ failures; release can go ahead. ☐ ★ failures listed above; fix first.

Signed: ____________________  Date: ____________

## Already checked automatically (website, 2026-10-22)

axe-core WCAG 2.1 A/AA on the homepage and results screen at desktop and phone widths found no
violations, keyboard tab order reaches the add-report flow, and phone tap targets were raised to at
least 44px. Automated checks can't judge screen-reader order, spoken language or real zoom
behaviour, which is why this checklist exists.
