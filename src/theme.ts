// FollowThrough Health design tokens, mirrored from the website's ui.css
// (see docs/followthrough-design-system.md in carewise-frontend).
export const colors = {
  bg: "#f8fafc",
  surface: "#ffffff",
  surface2: "#f1f5f9",
  surfaceBrand: "#f0fdfa",
  ink: "#1e293b",
  ink2: "#475569",
  ink3: "#64748b",
  line: "#e2e8f0",
  lineStrong: "#cbd5e1",
  placeholder: "#64748b",
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
