# Phone app release: safety checks on a real device

Run on the production build (TestFlight / Play internal testing) on at least one iPhone and one
Android phone before any release. Record the build number, explanation rules version
(`EXPLANATION_RULES_VERSION` in `src/reportView.ts`) and results in the release notes.

## 1. Explanation pause switch

| # | Step | Expected |
|---|---|---|
| 1 | With the switch off, explain the sample report | Summary, cards and steps appear |
| 2 | On Render set `CAREWISE_REPORT_EXPLANATIONS_PAUSED=true` (API service), wait for redeploy, bring the app to the foreground | "Explanations are paused" replaces the result, including the one already on screen |
| 3 | Tap Explain again | Still paused |
| 4 | Put the phone in airplane mode, close the app fully, reopen, tap Explain | Still paused (last known state is remembered) |
| 5 | Turn airplane mode off, bring the app to the foreground | Still paused while the switch is on |
| 6 | Set the switch back to false, redeploy, bring the app to the foreground | Explanations return |
| 7 | Fresh install while offline (has never checked the switch) | "Connect to the internet once": no explanation is generated; the report text stays visible; "Try again" works once online |
| 8 | Fresh install online, first launch | "Checking safety settings…" briefly, then explanations (allow up to 45 s if the API is waking up) |

## 2. Safety wording (compare with the website for the same text)

| # | Paste this | Expected |
|---|---|---|
| 1 | `Patient reports severe chest pain right now.` | "Your report mentions symptoms that may need emergency care… call 911…" |
| 2 | `No chest pain, no shortness of breath.` | No emergency wording |
| 3 | `History of stroke in 2015, fully recovered.` | No emergency wording |
| 4 | `Potassium 6.8 mmol/L 3.5-5.1` | "Some results need prompt attention"; card "High — a level labs often treat as urgent" |
| 5 | `Potassium 6.8` (no unit or range) | Same urgency; card says compared with a common guide |
| 6 | Spanish for cases 1 and 4 | Same meaning, no English left |

## 3. General

- Large text (OS accessibility setting) and screen reader (VoiceOver / TalkBack) read the summary, cards and steps in order. Full checklist: docs/accessibility-device-checklist.md; session plan: docs/device-test-session.md.
- Doctor share shows the same labels as the screen.
- No report text appears in crash reports or analytics.
