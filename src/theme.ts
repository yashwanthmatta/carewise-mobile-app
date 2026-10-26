// FollowThrough Health design tokens, mirrored from the website's ui.css
// (see docs/followthrough-design-system.md in carewise-frontend).
export const colors = {
  bg: "#f6f4ef",
  surface: "#ffffff",
  surface2: "#f3f1ec",
  surfaceBrand: "#eef7f5",
  ink: "#15191a",
  ink2: "#474f4d",
  ink3: "#5f6866",
  line: "#e3dfd7",
  lineStrong: "#cfc9bd",
  placeholder: "#8a918f",
  brand: "#0f766e",
  brandStrong: "#0b5c55",
  brandSoft: "#e3f2ef",
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
