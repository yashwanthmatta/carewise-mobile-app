// FollowThrough Health design tokens, mirrored from the website's ui.css
// (premium design system, see docs/premium-redesign-progress.md in carewise-frontend).
// Warm ivory page, soft cream panels, warm white cards, charcoal text, teal actions,
// terracotta accents (large text and icons; terracottaInk for small text, 5.4:1 on ivory).
import { Platform } from "react-native";

export const colors = {
  bg: "#FAF6EE",
  surface: "#FFFDF8",
  surface2: "#F3EDE2",
  surfaceBrand: "#EEF6F3",
  ink: "#292929",
  ink2: "#4A4540",
  ink3: "#635C55",
  line: "#E6DDCE",
  lineStrong: "#D3C7B4",
  placeholder: "#635C55",
  terracotta: "#B85C38",
  terracottaInk: "#A14E2E",
  terracottaSoft: "#F6E6DC",
  brand: "#0f766e",
  brandStrong: "#0b5c55",
  brandSoft: "#ccfbf1",
  attention: "#b45309",
  attentionInk: "#7c3a06",
  attentionSoft: "#fdf4e7",
  danger: "#b42318",
  dangerSoft: "#fdf0ee",
  infoSoft: "#eef3f8"
} as const;

export const radius = { sm: 10, md: 14, lg: 20, pill: 999 } as const;

export const type = {
  display: 30,
  heading: 24,
  cardHeading: 18,
  body: 16,
  small: 14,
  caption: 13
} as const;

// Serif headings from the phone's own fonts (no download): Georgia on iPhone, the system serif on Android.
export const fonts = {
  serif: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }) as string,
} as const;
