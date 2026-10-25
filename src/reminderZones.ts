// Reminder calls follow the clock of the person being reminded, not the phone of whoever sets
// them up (a parent in another state must not be called at night). Same list as the website.

export type ZoneChoice = { value: string; label: string };

export const REMINDER_TIME_ZONES: ZoneChoice[] = [
  { value: "America/New_York", label: "Eastern" },
  { value: "America/Chicago", label: "Central" },
  { value: "America/Denver", label: "Mountain" },
  { value: "America/Phoenix", label: "Arizona" },
  { value: "America/Los_Angeles", label: "Pacific" },
  { value: "America/Anchorage", label: "Alaska" },
  { value: "Pacific/Honolulu", label: "Hawaii" },
  { value: "America/Puerto_Rico", label: "Atlantic" },
];

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "America/New_York";
  } catch {
    return "America/New_York";
  }
}

// The US zones, plus this phone's zone when it is not one of them.
export function reminderZoneChoices(device: string = deviceTimeZone()): ZoneChoice[] {
  const choices = [...REMINDER_TIME_ZONES];
  if (device && !choices.some((choice) => choice.value === device)) choices.push({ value: device, label: device.replace(/_/g, " ") });
  return choices;
}
